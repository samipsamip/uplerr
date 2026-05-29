import { extractLinks, extractText, getDocumentProxy } from 'unpdf';

import {
	ResumeExtractionError,
	ResumeValidationError,
} from '../utils/error-utils';

class PDFParser {
	async parse(buffer: Uint8Array): Promise<{ text: string; links: string[] }> {
		let pdf;
		try {
			pdf = await getDocumentProxy(buffer);
		} catch {
			throw new ResumeValidationError(
				'CORRUPTED',
				'The provided PDF appears to be corrupted. Please try again with a different file.',
			);
		}

		const [{ totalPages, text }, { links }] = await Promise.all([
			extractText(pdf, { mergePages: true }),
			extractLinks(pdf),
		]).catch(() => {
			throw new ResumeExtractionError('Error extracting content from resume!');
		});

		if (totalPages > 5) {
			throw new ResumeValidationError(
				'PAGE_LIMIT',
				'The provided PDF has more than 5 pages, please upload a PDF with 5 pages or less.',
			);
		}

		return {
			text: text as string,
			links: (links as string[]).filter(Boolean),
		};
	}
}

const pdfParser = new PDFParser();
export default pdfParser;
