import type { CvStructuredData } from '@uppler/types';

import { api } from './client';

export type UserProfile = {
	cv: {
		filename: string;
		hasStructuredData: boolean;
		uploadedAt: string;
		is_verified: boolean;
		structuredData: CvStructuredData | null;
	} | null;
	full_name: string;
	id: string;
};

export type SkillMatchMeta = { matched: number; total: number };

export const postCreateProfileFromResume = async (resumePDF: FormData) => {
	return api
		.post('api/profile/upload-resume', { body: resumePDF, timeout: 120000 })
		.json<{
			message: string;
			structuredData: CvStructuredData;
			skillMatchMeta: SkillMatchMeta;
		}>();
};

export const getUserProfile = async () => {
	return api.get('api/profile').json<UserProfile>();
};

export const patchVerifyResume = async (structuredData?: CvStructuredData) => {
	return api
		.patch('api/profile/resume', { json: { structuredData } })
		.json<{ message: string }>();
};
