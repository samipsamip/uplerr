export class ResumeValidationError extends Error {
	constructor(
		public readonly code: 'CORRUPTED' | 'PAGE_LIMIT',
		message: string,
	) {
		super(message);
		this.name = 'ResumeValidationError';
	}
}

export class ResumeExtractionError extends Error {
	public readonly code = 'EXTRACTION_ERROR';
	constructor(message: string) {
		super(message);
		this.name = 'ResumeExtractionError';
	}
}
