import { and, eq } from 'drizzle-orm';
import crypto from 'node:crypto';
import { PDFParse } from 'pdf-parse';

import {
	deleteResumeFromBucket,
	uploadResumeToBucket,
} from '../../lib/upload-utils';
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

	const newKey = await uploadResumeToBucket(file, userId);
	await db
		.insert(profileSchema)
		.values({
			user_id: userId,
			resume_file_name: fileName,
			resume_hash: hash,
			resume_key: newKey,
		})
		.onConflictDoNothing();
};
export const processResumeReplacement = async (
	file: Blob,
	fileName: string,
	userId: string,
) => {
	const buffer = new Uint8Array(await file.arrayBuffer());
	const hash = crypto.createHash('sha256').update(buffer).digest('hex');

	const [profile] = await db
		.select({
			resume_key: profileSchema.resume_key,
			resume_hash: profileSchema.resume_hash,
		})
		.from(profileSchema)
		.where(eq(profileSchema.user_id, userId));

	if (profile?.resume_hash === hash) {
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

	if (profile?.resume_key) {
		await deleteResumeFromBucket(profile.resume_key);
	}

	await db
		.update(profileSchema)
		.set({
			resume_key: newKey,
			resume_hash: hash,
			resume_file_name: fileName,
			updated_at: new Date(),
		})
		.where(eq(profileSchema.user_id, userId));

	return { isDuplicate: false };
};
