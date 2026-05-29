import { eq } from 'drizzle-orm';
import { type ResumeStructuredData } from '@uppler/types';

import { factory } from '../../lib/factory';
import {
	createResumeExtractionFSM,
	ResumeTransitionState,
} from '../../lib/fsm/ResumeExtractionFSM';
import Claude from '../../lib/lllm/claude';
import { cvProfileSchema } from '../../schemas/cv_profiles.schema';
import db from '../../utils/db';
import { ResumeValidationError } from '../../utils/error-utils';
import {
	getActiveCvProfile,
	getUserProfileById,
	normalizeExtractedSkills,
	upsertCvExtractionSkills,
} from './profiles.service';

const claude = new Claude();

const MAX_FILE_SIZE = 2 * 1024 * 1024;

export const getUserProfile = factory.createHandlers(async (c) => {
	const user = c.get('user');
	const profileId = c.get('profileId');
	try {
		const [[userProfile], [cvProfile]] = await Promise.all([
			getUserProfileById(user.id),
			getActiveCvProfile(profileId),
		]);

		return c.json(
			{
				...userProfile,
				cv: cvProfile
					? {
							filename: cvProfile.original_filename,
							uploadedAt: cvProfile.uploaded_at,
							hasStructuredData: cvProfile.structured_data !== null,
							is_verified: cvProfile.is_verified,
							structuredData:
								cvProfile.structured_data as ResumeStructuredData | null,
						}
					: null,
			},
			200,
		);
	} catch {
		return c.json(
			{
				message: 'Error fetching user profile, please try again later',
			},
			500,
		);
	}
});

export const createUserProfile = factory.createHandlers(async (c) => {
	const user = c.get('user');
	const profileId = c.get('profileId');
	const resumeFormData = await c.req.formData();
	const resume = resumeFormData.get('resume');

	if (!resume || !(resume instanceof File)) {
		return c.json({ message: 'Please provide a PDF file.' }, 400);
	}
	if (resume.size === 0) {
		return c.json(
			{ message: 'The provided file is empty, please upload a resume.' },
			400,
		);
	}
	if (resume.size > MAX_FILE_SIZE) {
		return c.json(
			{ message: 'The provided file exceeds the maximum allowed size of 2MB.' },
			413,
		);
	}

	try {
		const machine = createResumeExtractionFSM({
			file: resume,
			userId: user.id,
			profileId,
		});

		await machine.run();

		if (machine.value === ResumeTransitionState.DONE) {
			return c.json(
				{
					message: 'CV uploaded successfully.',
					structuredData: machine.structuredData,
					skillMatchMeta: machine.skillMatchMeta,
				},
				201,
			);
		}

		if (machine.value === ResumeTransitionState.RESUME_DUPLICATE) {
			return c.json({ message: 'This resume has already been uploaded.' }, 200);
		}

		if (machine.value === ResumeTransitionState.RESUME_VALIDATION_ERROR) {
			const err = machine.error;
			if (err instanceof ResumeValidationError && err.code === 'PAGE_LIMIT') {
				return c.json({ message: err.message }, 413);
			}
			return c.json(
				{ message: err instanceof Error ? err.message : 'Invalid PDF.' },
				400,
			);
		}

		if (machine.value === ResumeTransitionState.RESUME_EXTRACTION_ERROR) {
			const err = machine.error;
			return c.json(
				{
					message:
						err instanceof Error
							? err.message
							: 'Failed to extract text from resume.',
				},
				400,
			);
		}

		if (machine.value === ResumeTransitionState.RESUME_PARSE_FAILED) {
			return c.json(
				{
					message:
						'The uploaded document does not appear to be a valid resume.',
				},
				422,
			);
		}

		return c.json(
			{
				message:
					'An error occurred while uploading the resume. Please try again later.',
			},
			500,
		);
	} catch {
		return c.json(
			{
				message:
					'An error occurred while uploading the resume. Please try again later.',
			},
			500,
		);
	}
});

export const verifyUserResume = factory.createHandlers(async (c) => {
	const profileId = c.get('profileId');
	const body = await c.req.json<{ structuredData?: ResumeStructuredData }>();

	const [active] = await getActiveCvProfile(profileId);
	if (!active) {
		return c.json({ message: 'No active CV found.' }, 404);
	}

	try {
		const structuredData =
			body.structuredData ??
			(active.structured_data as ResumeStructuredData | null);

		await db
			.update(cvProfileSchema)
			.set({
				is_verified: true,
				...(body.structuredData
					? { structured_data: body.structuredData }
					: {}),
				updated_at: new Date(),
			})
			.where(eq(cvProfileSchema.id, active.id));

		if (structuredData?.skills?.length) {
			const rawSkills = structuredData.skills;
			const workHistoryText = structuredData.experience
				.map(
					(e) =>
						`${e.role} at ${e.company}${e.duration ? ` (${e.duration})` : ''}: ${e.description ?? ''}`,
				)
				.join('\n\n');

			const [normalized, levelMap] = await Promise.all([
				normalizeExtractedSkills(rawSkills),
				claude.inferSkillLevels(rawSkills, workHistoryText),
			]);

			const skillsToUpsert = normalized.map((s) => ({
				canonicalName: s.canonicalName,
				canonicalId: s.canonicalId,
				category: s.category,
				level:
					levelMap.get(s.rawName.toLowerCase()) ?? ('intermediate' as const),
			}));

			await upsertCvExtractionSkills(profileId, skillsToUpsert);
		}

		return c.json({ message: 'CV verified successfully.' }, 200);
	} catch {
		return c.json(
			{
				message:
					'An error occurred while verifying the resume. Please try again later.',
			},
			500,
		);
	}
});
