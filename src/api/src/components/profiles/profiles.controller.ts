import { factory } from '../../lib/factory';
import { llmService } from '../../lib/lllm';
import {
	ResumeExtractionError,
	ResumeValidationError,
} from '../../utils/error-utils';
import {
	createUserProfileFromCV,
	extractTextFromPDF,
	getActiveCvProfile,
	getUserProfileById,
	processResumeReplacement,
} from './profiles.service';

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
		await createUserProfileFromCV(resume, resume.name, user.id, profileId);
		const resumeExtractedText = await extractTextFromPDF(resume);
		const claudeReply =
			await llmService.extractDetailsFromResume(resumeExtractedText);
		return c.json(
			{
				message: 'CV uploaded successfully.',
				extractedText: resumeExtractedText,
				claudeReply,
			},
			201,
		);
	} catch (error) {
		if (error instanceof ResumeExtractionError) {
			return c.json(
				{
					message: error.message,
				},
				400,
			);
		}
		if (error instanceof ResumeValidationError) {
			return c.json(
				{ message: error.message },
				error.code === 'PAGE_LIMIT' ? 413 : 400,
			);
		}
		return c.json(
			{
				message:
					'An error occurred while uploading the resume. Please try again later.',
				error,
			},
			500,
		);
	}
});

export const updateUserResume = factory.createHandlers(async (c) => {
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
		const result = await processResumeReplacement(
			resume,
			resume.name,
			user.id,
			profileId,
		);
		if (result.isDuplicate) {
			return c.json({ message: 'This resume has already been uploaded.' }, 201);
		}
		return c.json({ message: 'CV uploaded successfully.' }, 201);
	} catch (error) {
		if (error instanceof ResumeValidationError) {
			return c.json(
				{ message: error.message },
				error.code === 'PAGE_LIMIT' ? 413 : 400,
			);
		}
		return c.json(
			{
				message:
					'An error occurred while uploading the resume. Please try again later.',
			},
			500,
		);
	}
});
