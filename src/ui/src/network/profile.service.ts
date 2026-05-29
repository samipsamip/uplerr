import type { ResumeStructuredData } from '@uppler/types';

import { api } from './client';

export type UserProfile = {
	cv: {
		filename: string;
		hasStructuredData: boolean;
		uploadedAt: string;
		is_verified: boolean;
		structuredData: ResumeStructuredData | null;
	} | null;
	cv_generations_used: number;
	full_name: string;
	id: string;
	study_plans_used: number;
	subscription_tier: 'free' | 'pro' | 'premium';
	usage_reset_at: string | null;
};

export type SkillMatchMeta = { matched: number; total: number };

export const postCreateProfileFromResume = async (resumePDF: FormData) => {
	return api
		.post('api/profile/upload-resume', { body: resumePDF, timeout: 120000 })
		.json<{
			message: string;
			structuredData: ResumeStructuredData;
			skillMatchMeta: SkillMatchMeta;
		}>();
};

export const getUserProfile = async () => {
	return api.get('api/profile').json<UserProfile>();
};

export const patchVerifyResume = async (
	structuredData?: ResumeStructuredData,
) => {
	return api
		.patch('api/profile/resume', { json: { structuredData } })
		.json<{ message: string }>();
};
