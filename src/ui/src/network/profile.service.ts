import { api } from './client';

type UserProfile = {
	cv: {
		filename: string;
		hasStructuredData: boolean;
		uploadedAt: string;
	} | null;
	cv_generations_used: number;
	full_name: string;
	id: string;
	study_plans_used: number;
	subscription_tier: 'free' | 'pro' | 'premium'; // adjust as needed
	usage_reset_at: string | null;
};

export const postUpdateResume = async (resumePDF: FormData) => {
	return api
		.post('api/profile/update-resume', { body: resumePDF })
		.json<{ message: string }>();
};

export const postCreateProfileFromResume = async (resumePDF: FormData) => {
	return api
		.post('api/profile/upload-resume', { body: resumePDF, timeout: 120000 })
		.json<{ message: string }>();
};

export const getUserProfile = async () => {
	return api.get('api/profile').json<UserProfile>();
};
