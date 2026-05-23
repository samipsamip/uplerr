import { api } from './client';

export const postUpdateResume = async (resumePDF: FormData) => {
	return api
		.post('api/profile/update-resume', { body: resumePDF })
		.json<{ message: string }>();
};

export const postCreateProfileFromResume = async (resumePDF: FormData) => {
	return api
		.post('api/profile/create-profile', { body: resumePDF })
		.json<{ message: string }>();
};

export const getUserProfile = async () => {
	return api.get('api/profile').json<{
		id: string;
		createdAt: string;
		resume_file_name: string;
		skills: Array<Record<string, string>>;
		skillsExtracted: number;
	}>();
};
