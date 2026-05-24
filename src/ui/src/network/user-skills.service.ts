import { api } from './client';

export type SkillCategory =
	| 'Frontend'
	| 'Backend'
	| 'Mobile'
	| 'DevOps'
	| 'Cloud'
	| 'Data'
	| 'Design'
	| 'Testing'
	| 'Security'
	| 'Other';

export type SkillLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';

export type AddSkillPayload = {
	name: string;
	category: SkillCategory;
	level: SkillLevel;
};

export type UserSkill = {
	id: string;
	name: string;
	category: SkillCategory;
	level: SkillLevel;
	source: string;
};

export const getUserSkills = async () => {
	return api.get('api/skills').json<UserSkill[]>();
};

export type UpdateSkillPayload = Partial<
	Pick<AddSkillPayload, 'name' | 'category' | 'level'>
>;

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
