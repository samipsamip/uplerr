import { and, eq } from 'drizzle-orm';
import { PDFParse, type TextResult } from 'pdf-parse';

import { cvProfileSchema } from '../../schemas/cv_profiles.schema';
import {
	profileSchema,
	userProfilePublicFields,
} from '../../schemas/profiles.schema';
import db from '../../utils/db';
import {
	ResumeExtractionError,
	ResumeValidationError,
} from '../../utils/error-utils';
import { notDeleted } from '../../utils/helpers';

export const validatePdf = async (buffer: Uint8Array): Promise<void> => {
	let parser: InstanceType<typeof PDFParse> | null = null;
	try {
		parser = new PDFParse(buffer);
		const info = await parser.getInfo();
		if (info.total > 5) {
			throw new ResumeValidationError(
				'PAGE_LIMIT',
				'The provided PDF has more than 5 pages, please upload a PDF with 5 pages or less.',
			);
		}
	} catch (error) {
		if (error instanceof ResumeValidationError) throw error;
		throw new ResumeValidationError(
			'CORRUPTED',
			'The provided PDF appears to be corrupted. Please try again with a different file.',
		);
	} finally {
		await parser?.destroy();
	}
};

export const extractTextFromPDF = async (
	file: File,
): Promise<TextResult['text']> => {
	const buffer = new Uint8Array(await file.arrayBuffer());
	let parser: InstanceType<typeof PDFParse> | null = null;
	try {
		parser = new PDFParse(buffer);
		const rawText = await parser.getText();
		if (!rawText?.text || rawText?.text === '') {
			return '';
		}
		return rawText.text;
	} catch {
		throw new ResumeExtractionError('Error extracting text from resume!');
	} finally {
		await parser?.destroy();
	}
};

export const getUserProfileById = async (userId: string) => {
	return db
		.select(userProfilePublicFields)
		.from(profileSchema)
		.where(and(eq(profileSchema.user_id, userId), notDeleted(profileSchema)))
		.limit(1);
};

export const getActiveCvProfile = async (profileId: string) => {
	return db
		.select()
		.from(cvProfileSchema)
		.where(
			and(
				eq(cvProfileSchema.profile_id, profileId),
				eq(cvProfileSchema.is_active, true),
				notDeleted(cvProfileSchema),
			),
		)
		.limit(1);
};
