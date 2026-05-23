export class ResumeValidationError extends Error {
	constructor(
		public readonly code: 'CORRUPTED' | 'PAGE_LIMIT',
		message: string,
	) {
		super(message);
		this.name = 'ResumeValidationError';
	}
}
