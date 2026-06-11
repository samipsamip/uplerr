import { promises as dns } from 'dns';
import { isIP } from 'net';

const ALLOWED_SCHEMES = new Set(['http:', 'https:']);

// Private, loopback, link-local, and reserved IPv4/IPv6 ranges
const PRIVATE_IPV4 = [
	/^127\./, // loopback
	/^10\./, // RFC 1918
	/^172\.(1[6-9]|2\d|3[01])\./, // RFC 1918
	/^192\.168\./, // RFC 1918
	/^169\.254\./, // link-local / AWS metadata
	/^0\./, // "this" network
	/^100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\./, // CGNAT RFC 6598
	/^198\.1[89]\./, // benchmark RFC 2544
	/^198\.51\.100\./, // documentation RFC 5737
	/^203\.0\.113\./, // documentation RFC 5737
	/^2(4[0-9]|5[0-5])\./, // reserved/multicast
];

const PRIVATE_IPV6 = [
	/^::1$/, // loopback
	/^fe[89ab][0-9a-f]:/i, // link-local fe80::/10
	/^f[cd][0-9a-f]{2}:/i, // unique local fc00::/7
	/^::ffff:/i, // IPv4-mapped
	/^64:ff9b:/i, // IPv4/IPv6 translation
];

export class UrlValidationError extends Error {
	constructor(
		message: string,
		public readonly code:
			| 'INVALID_URL'
			| 'DISALLOWED_SCHEME'
			| 'PRIVATE_IP'
			| 'UNRESOLVABLE',
	) {
		super(message);
		this.name = 'UrlValidationError';
	}
}

export function isPrivateIP(ip: string): boolean {
	const patterns = isIP(ip) === 6 ? PRIVATE_IPV6 : PRIVATE_IPV4;
	return patterns.some((r) => r.test(ip));
}

async function resolveIPs(hostname: string): Promise<string[]> {
	const [v4, v6] = await Promise.allSettled([
		dns.resolve4(hostname),
		dns.resolve6(hostname),
	]);
	return [
		...(v4.status === 'fulfilled' ? v4.value : []),
		...(v6.status === 'fulfilled' ? v6.value : []),
	];
}

/**
 * Validates a URL for safety and returns the parsed URL object.
 * Throws UrlValidationError on any violation.
 *
 * Protections:
 * - Allowlist of schemes (http/https only)
 * - Hostname-level private IP check
 * - DNS resolution + resolved-IP private range check (SSRF/DNS-rebinding)
 */
export async function validateUrl(rawUrl: string): Promise<URL> {
	let parsed: URL;
	try {
		parsed = new URL(rawUrl.trim());
	} catch {
		throw new UrlValidationError('Malformed URL', 'INVALID_URL');
	}

	if (!ALLOWED_SCHEMES.has(parsed.protocol)) {
		throw new UrlValidationError(
			`Scheme "${parsed.protocol}" is not allowed`,
			'DISALLOWED_SCHEME',
		);
	}

	const { hostname } = parsed;

	// If the hostname is already a raw IP, validate it directly
	if (isIP(hostname)) {
		if (isPrivateIP(hostname)) {
			throw new UrlValidationError(
				'Direct IP addresses in private ranges are not allowed',
				'PRIVATE_IP',
			);
		}
		return parsed;
	}

	// Resolve DNS and check every returned address
	const addresses = await resolveIPs(hostname);

	if (addresses.length === 0) {
		throw new UrlValidationError(
			`Could not resolve hostname: ${hostname}`,
			'UNRESOLVABLE',
		);
	}

	for (const addr of addresses) {
		if (isPrivateIP(addr)) {
			throw new UrlValidationError(
				`Hostname resolves to a private IP address (${addr})`,
				'PRIVATE_IP',
			);
		}
	}

	return parsed;
}

/**
 * Validates a redirect Location header URL relative to the originating URL.
 * Re-runs the full DNS check to prevent redirect-based SSRF.
 */
export async function validateRedirect(
	location: string,
	origin: URL,
): Promise<URL> {
	// Resolve relative redirects against the current origin
	const resolved = new URL(location, origin);
	return validateUrl(resolved.toString());
}
