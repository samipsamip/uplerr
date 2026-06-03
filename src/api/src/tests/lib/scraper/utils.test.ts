import { describe, expect, it } from 'vitest';

import { normalizeText } from '../../../lib/scraper/utils';

describe('normalizeText', () => {
	it('removes null bytes', () => {
		expect(normalizeText('hello\0world')).toBe('helloworld');
	});

	it('removes zero-width and soft-hyphen characters', () => {
		expect(normalizeText('hel​lo')).toBe('hello');
		expect(normalizeText('hel﻿lo')).toBe('hello');
	});

	it('normalises CRLF and bare CR to LF', () => {
		expect(normalizeText('a\r\nb\rc')).toBe('a\nb\nc');
	});

	it('collapses 3+ consecutive newlines to 2', () => {
		expect(normalizeText('a\n\n\n\nb')).toBe('a\n\nb');
	});

	it('collapses multiple spaces/tabs on a line to one space', () => {
		expect(normalizeText('foo   bar\t\tbaz')).toBe('foo bar baz');
	});

	it('trims each line', () => {
		expect(normalizeText('  line one  \n  line two  ')).toBe(
			'line one\nline two',
		);
	});

	it('trims the entire result', () => {
		expect(normalizeText('\n\n  text  \n\n')).toBe('text');
	});

	it('returns empty string for blank input', () => {
		expect(normalizeText('   \n\n  ')).toBe('');
	});
});
