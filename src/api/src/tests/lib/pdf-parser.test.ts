import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
	ResumeExtractionError,
	ResumeValidationError,
} from '../../utils/error-utils';

const unpdfMocks = vi.hoisted(() => ({
	getDocumentProxy: vi.fn(),
	extractText: vi.fn(),
	extractLinks: vi.fn(),
}));

vi.mock('unpdf', () => ({
	getDocumentProxy: unpdfMocks.getDocumentProxy,
	extractText: unpdfMocks.extractText,
	extractLinks: unpdfMocks.extractLinks,
}));

const { default: pdfParser } = await import('../../lib/pdf-parser');

const fakeBuffer = new Uint8Array([1, 2, 3]);
const fakePdf = {};

beforeEach(() => {
	vi.clearAllMocks();
	unpdfMocks.getDocumentProxy.mockResolvedValue(fakePdf);
	unpdfMocks.extractText.mockResolvedValue({
		totalPages: 1,
		text: 'Resume content',
	});
	unpdfMocks.extractLinks.mockResolvedValue({
		links: ['https://github.com/user'],
	});
});

describe('PDFParser.parse — happy path', () => {
	it('returns text and links from a valid PDF', async () => {
		const result = await pdfParser.parse(fakeBuffer);
		expect(result.text).toBe('Resume content');
		expect(result.links).toEqual(['https://github.com/user']);
	});

	it('filters out falsy link values', async () => {
		unpdfMocks.extractLinks.mockResolvedValue({
			links: [
				'https://github.com/user',
				'',
				null,
				'https://linkedin.com/in/user',
			],
		});
		const { links } = await pdfParser.parse(fakeBuffer);
		expect(links).toEqual([
			'https://github.com/user',
			'https://linkedin.com/in/user',
		]);
	});

	it('allows exactly 5 pages', async () => {
		unpdfMocks.extractText.mockResolvedValue({
			totalPages: 5,
			text: 'content',
		});
		await expect(pdfParser.parse(fakeBuffer)).resolves.toMatchObject({
			text: 'content',
		});
	});

	it('passes the buffer to getDocumentProxy', async () => {
		await pdfParser.parse(fakeBuffer);
		expect(unpdfMocks.getDocumentProxy).toHaveBeenCalledWith(fakeBuffer);
	});

	it('passes the pdf proxy to extractText and extractLinks', async () => {
		await pdfParser.parse(fakeBuffer);
		expect(unpdfMocks.extractText).toHaveBeenCalledWith(fakePdf, {
			mergePages: true,
		});
		expect(unpdfMocks.extractLinks).toHaveBeenCalledWith(fakePdf);
	});

	it('runs extractText and extractLinks in parallel', async () => {
		const order: string[] = [];
		unpdfMocks.extractText.mockImplementation(async () => {
			order.push('extractText');
			return { totalPages: 1, text: 'text' };
		});
		unpdfMocks.extractLinks.mockImplementation(async () => {
			order.push('extractLinks');
			return { links: [] };
		});

		await pdfParser.parse(fakeBuffer);

		expect(order).toHaveLength(2);
		expect(order).toContain('extractText');
		expect(order).toContain('extractLinks');
	});
});

describe('PDFParser.parse — validation errors', () => {
	it('throws CORRUPTED when getDocumentProxy fails', async () => {
		unpdfMocks.getDocumentProxy.mockRejectedValue(new Error('bad pdf'));
		const err = await pdfParser.parse(fakeBuffer).catch((e) => e);
		expect(err).toBeInstanceOf(ResumeValidationError);
		expect(err.code).toBe('CORRUPTED');
	});

	it('throws PAGE_LIMIT when PDF exceeds 5 pages', async () => {
		unpdfMocks.extractText.mockResolvedValue({
			totalPages: 6,
			text: 'content',
		});
		const err = await pdfParser.parse(fakeBuffer).catch((e) => e);
		expect(err).toBeInstanceOf(ResumeValidationError);
		expect(err.code).toBe('PAGE_LIMIT');
	});
});

describe('PDFParser.parse — extraction errors', () => {
	it('throws ResumeExtractionError when extractText fails', async () => {
		unpdfMocks.extractText.mockRejectedValue(new Error('extraction failed'));
		await expect(pdfParser.parse(fakeBuffer)).rejects.toBeInstanceOf(
			ResumeExtractionError,
		);
	});

	it('throws ResumeExtractionError when extractLinks fails', async () => {
		unpdfMocks.extractLinks.mockRejectedValue(
			new Error('link extraction failed'),
		);
		await expect(pdfParser.parse(fakeBuffer)).rejects.toBeInstanceOf(
			ResumeExtractionError,
		);
	});
});
