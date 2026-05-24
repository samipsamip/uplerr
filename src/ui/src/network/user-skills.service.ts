import type {
	AddSkillPayload,
	UpdateSkillPayload,
	UserSkill,
} from '@uppler/types';

import { api } from './client';

export type {
	AddSkillPayload,
	SkillCategory,
	SkillLevel,
	UpdateSkillPayload,
	UserSkill,
} from '@uppler/types';

export const getUserSkills = async () => {
	return api.get('api/skills').json<UserSkill[]>();
};

export const postAddSkill = async (payload: AddSkillPayload) => {
	return api.post('api/skills/add-skills', { json: payload }).json();
};

export const putUpdateSkill = async (
	skillId: string,
	payload: UpdateSkillPayload,
) => {
	return api
		.put(`api/skills/update-skills/${skillId}`, { json: payload })
		.json<UserSkill>();
};

export const deleteSkill = async (skillId: string) => {
	return api
		.delete(`api/skills/delete-skills/${skillId}`)
		.json<{ message: string }>();
};
