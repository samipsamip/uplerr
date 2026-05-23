import { and, eq } from 'drizzle-orm';
import crypto from 'node:crypto';
import { PDFParse } from 'pdf-parse';

import {
	deleteResumeFromBucket,
	uploadResumeToBucket,
} from '../../lib/upload-utils';
import { cvProfileSchema } from '../../schemas/cv_profiles.schema';
import {
	profileSchema,
	userProfilePublicFields,
} from '../../schemas/profiles.schema';
import db from '../../utils/db';
import { ResumeValidationError } from '../../utils/error-utils';
import { notDeleted } from '../../utils/helpers';

export const getUserProfileById = async (userId: string) => {
	return db
		.select(userProfilePublicFields)
		.from(profileSchema)
		.where(and(eq(profileSchema.user_id, userId), notDeleted(profileSchema)))
		.limit(1);
};

export const getActiveCvProfile = async (userId: string) => {
	return db
		.select()
		.from(cvProfileSchema)
		.where(
			and(
				eq(cvProfileSchema.user_id, userId),
				eq(cvProfileSchema.is_active, true),
				notDeleted(cvProfileSchema),
			),
		)
		.limit(1);
};

export const createUserProfileFromCV = async (
	file: Blob,
	fileName: string,
	userId: string,
) => {
	const buffer = new Uint8Array(await file.arrayBuffer());
	const hash = crypto.createHash('sha256').update(buffer).digest('hex');
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

	const resumeKey = await uploadResumeToBucket(file, userId);

	await db.transaction(async (tx) => {
		await tx
			.insert(profileSchema)
			.values({ user_id: userId })
			.onConflictDoNothing();

		await tx.insert(cvProfileSchema).values({
			user_id: userId,
			original_filename: fileName,
			resume_key: resumeKey,
			resume_hash: hash,
			is_active: true,
		});
	});
};

export const processResumeReplacement = async (
	file: Blob,
	fileName: string,
	userId: string,
) => {
	const buffer = new Uint8Array(await file.arrayBuffer());
	const hash = crypto.createHash('sha256').update(buffer).digest('hex');

	const [activeProfile] = await db
		.select({
			id: cvProfileSchema.id,
			resume_key: cvProfileSchema.resume_key,
			resume_hash: cvProfileSchema.resume_hash,
		})
		.from(cvProfileSchema)
		.where(
			and(
				eq(cvProfileSchema.user_id, userId),
				eq(cvProfileSchema.is_active, true),
				notDeleted(cvProfileSchema),
			),
		)
		.limit(1);

	if (activeProfile?.resume_hash === hash) {
		return { isDuplicate: true };
	}

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

	const newKey = await uploadResumeToBucket(file, userId);

	if (activeProfile?.resume_key) {
		await deleteResumeFromBucket(activeProfile.resume_key);
	}

	await db.transaction(async (tx) => {
		if (activeProfile?.id) {
			await tx
				.update(cvProfileSchema)
				.set({ is_active: false, updated_at: new Date() })
				.where(eq(cvProfileSchema.id, activeProfile.id));
		}

		await tx.insert(cvProfileSchema).values({
			user_id: userId,
			original_filename: fileName,
			resume_key: newKey,
			resume_hash: hash,
			is_active: true,
		});
	});

	return { isDuplicate: false };
};
