import { factory } from '../../lib/factory';
import {
	addSkill,
	deleteSkill,
	getSkillsByProfileId,
	updateSkill,
} from './skills.service';
import type { AddSkillPayload, UpdateSkillPayload } from './skills.types';

export const getUserSkills = factory.createHandlers(async (c) => {
	const profileId = c.get('profileId');
	try {
		const result = await getSkillsByProfileId(profileId);
		return c.json(result, 200);
	} catch {
		return c.json(
			{ message: 'Error fetching user skills, please try again later!' },
			500,
		);
	}
});

export const addUserSkills = factory.createHandlers(async (c) => {
	const profileId = c.get('profileId');
	const body = await c.req.json<AddSkillPayload>();

	if (!body.name || !body.category || !body.level) {
		return c.json({ message: 'name, category and level are required.' }, 400);
	}

	try {
		const skill = await addSkill(profileId, body);
		return c.json(skill, 201);
	} catch {
		return c.json(
			{ message: 'Error adding skill, please try again later.' },
			500,
		);
	}
});
export const updateUserSkill = factory.createHandlers(async (c) => {
	const profileId = c.get('profileId');
	const skillId = c.req.param('skillId');
	if (!skillId) return c.json({ message: 'Skill ID is required.' }, 400);

	const body = await c.req.json<UpdateSkillPayload>();

	try {
		const skill = await updateSkill(skillId, profileId, body);
		if (!skill) return c.json({ message: 'Skill not found.' }, 404);
		return c.json(skill, 200);
	} catch {
		return c.json(
			{ message: 'Error updating skill, please try again later.' },
			500,
		);
	}
});

export const deleteUserSkill = factory.createHandlers(async (c) => {
	const profileId = c.get('profileId');
	const skillId = c.req.param('skillId');
	if (!skillId) return c.json({ message: 'Skill ID is required.' }, 400);

	try {
		const skill = await deleteSkill(skillId, profileId);
		if (!skill) return c.json({ message: 'Skill not found.' }, 404);
		return c.json({ message: 'Skill deleted.' }, 200);
	} catch {
		return c.json(
			{ message: 'Error deleting skill, please try again later.' },
			500,
		);
	}
});
