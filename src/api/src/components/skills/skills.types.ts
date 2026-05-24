import {
	skillCategoryEnum,
	skillLevelEnum,
} from '../../schemas/user_skills.schema';

export type SkillCategory = (typeof skillCategoryEnum.enumValues)[number];
export type SkillLevel = (typeof skillLevelEnum.enumValues)[number];

export type AddSkillPayload = {
	name: string;
	category: SkillCategory;
	level: SkillLevel;
	source?: string;
};

export type UpdateSkillPayload = {
	name?: string;
	category?: SkillCategory;
	level?: SkillLevel;
};
