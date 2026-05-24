import { factory } from '../../lib/factory';
import { authMiddleWare } from '../../lib/middleware';
import {
	addUserSkills,
	deleteUserSkill,
	getUserSkills,
	updateUserSkill,
} from './skills.controller';

const skillsRoute = factory.createApp();

skillsRoute.get('/', authMiddleWare, ...getUserSkills);
skillsRoute.post('/add-skills', authMiddleWare, ...addUserSkills);
skillsRoute.put('/update-skills/:skillId', authMiddleWare, ...updateUserSkill);
skillsRoute.delete(
	'/delete-skills/:skillId',
	authMiddleWare,
	...deleteUserSkill,
);
export default skillsRoute;
