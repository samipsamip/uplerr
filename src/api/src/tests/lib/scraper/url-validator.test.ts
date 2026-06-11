import { beforeEach, describe, expect, it, vi } from 'vitest';

const dnsMocks = vi.hoisted(() => ({
	resolve4: vi.fn(),
	resolve6: vi.fn(),
}));

vi.mock('dns', () => ({
	promises: dnsMocks,
}));

const { isPrivateIP, UrlValidationError, validateRedirect, validateUrl } =
	await import('../../../lib/scraper/url-validator');

beforeEach(() => {
	vi.clearAllMocks();
	// By default, resolve to a public IP and no IPv6
	dnsMocks.resolve4.mockResolvedValue(['93.184.216.34']); // example.com
	dnsMocks.resolve6.mockRejectedValue(new Error('no AAAA'));
});

// ── isPrivateIP ────────────────────────────────────────────────────────────────

describe('isPrivateIP', () => {
	it.each([
		['127.0.0.1'],
		['10.0.0.1'],
		['172.16.0.1'],
		['192.168.1.1'],
		['169.254.1.1'],
		['0.0.0.1'],
	])('identifies %s as private IPv4', (ip) => {
		expect(isPrivateIP(ip)).toBe(true);
	});

	it.each([['8.8.8.8'], ['93.184.216.34'], ['1.1.1.1']])(
		'identifies %s as public IPv4',
		(ip) => {
			expect(isPrivateIP(ip)).toBe(false);
		},
	);

	it('identifies IPv6 loopback as private', () => {
		expect(isPrivateIP('::1')).toBe(true);
	});

	it('identifies IPv6 link-local as private', () => {
		expect(isPrivateIP('fe80::1')).toBe(true);
	});

	it('identifies IPv6 unique-local as private', () => {
		expect(isPrivateIP('fc00::1')).toBe(true);
	});
});

// ── validateUrl ────────────────────────────────────────────────────────────────

describe('validateUrl', () => {
	it('throws INVALID_URL for malformed URLs', async () => {
		await expect(validateUrl('not a url')).rejects.toMatchObject({
			code: 'INVALID_URL',
		});
	});

	it('throws DISALLOWED_SCHEME for ftp://', async () => {
		await expect(validateUrl('ftp://example.com/file')).rejects.toMatchObject({
			code: 'DISALLOWED_SCHEME',
		});
	});

	it('throws DISALLOWED_SCHEME for file://', async () => {
		await expect(validateUrl('file:///etc/passwd')).rejects.toMatchObject({
			code: 'DISALLOWED_SCHEME',
		});
	});

	it('throws PRIVATE_IP when hostname is a private IP', async () => {
		await expect(validateUrl('http://192.168.1.1/path')).rejects.toMatchObject({
			code: 'PRIVATE_IP',
		});
	});

	it('allows a public raw IP', async () => {
		const url = await validateUrl('http://93.184.216.34/path');
		expect(url.hostname).toBe('93.184.216.34');
	});

	it('throws UNRESOLVABLE when DNS returns no addresses', async () => {
		dnsMocks.resolve4.mockResolvedValue([]);
		dnsMocks.resolve6.mockResolvedValue([]);
		await expect(
			validateUrl('https://nxdomain.invalid/'),
		).rejects.toMatchObject({ code: 'UNRESOLVABLE' });
	});

	it('throws PRIVATE_IP when hostname resolves to a private IP', async () => {
		dnsMocks.resolve4.mockResolvedValue(['10.0.0.1']);
		await expect(
			validateUrl('https://internal.example.com/'),
		).rejects.toMatchObject({ code: 'PRIVATE_IP' });
	});

	it('resolves successfully for a public hostname', async () => {
		const url = await validateUrl('https://example.com/job');
		expect(url.hostname).toBe('example.com');
	});

	it('accepts https scheme', async () => {
		const url = await validateUrl('https://example.com/');
		expect(url.protocol).toBe('https:');
	});

	it('accepts http scheme', async () => {
		const url = await validateUrl('http://example.com/');
		expect(url.protocol).toBe('http:');
	});

	it('trims whitespace from the URL before parsing', async () => {
		const url = await validateUrl('  https://example.com/  ');
		expect(url.hostname).toBe('example.com');
	});

	it('resolves successfully using only IPv6 when IPv4 lookup fails', async () => {
		dnsMocks.resolve4.mockRejectedValue(new Error('No A record'));
		dnsMocks.resolve6.mockResolvedValue([
			'2606:2800:21f:cb07:6820:80da:af6b:8b2c',
		]);
		const url = await validateUrl('https://ipv6only.example.com/');
		expect(url.hostname).toBe('ipv6only.example.com');
	});

	it('UrlValidationError has the correct code', async () => {
		try {
			await validateUrl('ftp://example.com');
		} catch (err) {
			expect(err).toBeInstanceOf(UrlValidationError);
			expect((err as InstanceType<typeof UrlValidationError>).code).toBe(
				'DISALLOWED_SCHEME',
			);
		}
	});
});

// ── validateRedirect ───────────────────────────────────────────────────────────

describe('validateRedirect', () => {
	it('resolves a relative redirect against the origin', async () => {
		const origin = new URL('https://example.com/old');
		const url = await validateRedirect('/new-path', origin);
		expect(url.pathname).toBe('/new-path');
		expect(url.hostname).toBe('example.com');
	});

	it('validates an absolute redirect URL', async () => {
		const origin = new URL('https://example.com/');
		const url = await validateRedirect('https://example.com/new', origin);
		expect(url.href).toBe('https://example.com/new');
	});

	it('rejects a redirect to a private IP hostname', async () => {
		dnsMocks.resolve4.mockResolvedValue(['10.0.0.1']);
		const origin = new URL('https://example.com/');
		await expect(
			validateRedirect('https://internal.corp/', origin),
		).rejects.toMatchObject({ code: 'PRIVATE_IP' });
	});
});
