import { factory } from '../../lib/factory';
import { authMiddleWare } from '../../lib/middleware';
import {
	createUserProfile,
	getUserProfile,
	updateUserResume,
} from './profiles.controller';

const profileRoute = factory.createApp();

profileRoute.get('/', authMiddleWare, ...getUserProfile);
profileRoute.post('/create-profile', authMiddleWare, ...createUserProfile);
profileRoute.post('/update-resume', authMiddleWare, ...updateUserResume);

export default profileRoute;
