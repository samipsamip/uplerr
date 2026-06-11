// ── Text normalisation ────────────────────────────────────────────────────────

export function normalizeText(raw: string): string {
	return raw
		.replace(/\0/g, '')
		.replace(/[\u200B-\u200D\uFEFF\u00AD]/g, '')
		.replace(/\r\n|\r/g, '\n')
		.replace(/\n{3,}/g, '\n\n')
		.split('\n')
		.map((l) => l.replace(/[ \t]+/g, ' ').trim())
		.join('\n')
		.trim();
}
