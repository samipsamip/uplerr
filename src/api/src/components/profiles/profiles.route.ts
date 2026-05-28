import { factory } from '../../lib/factory';
import { authMiddleWare } from '../../lib/middleware';
import {
	createUserProfile,
	getUserProfile,
	updateUserResume,
	verifyUserResume,
} from './profiles.controller';

const profileRoute = factory.createApp();

profileRoute.get('/', authMiddleWare, ...getUserProfile);
profileRoute.post('/upload-resume', authMiddleWare, ...createUserProfile);
profileRoute.post('/update-resume', authMiddleWare, ...updateUserResume);
profileRoute.patch('/resume', authMiddleWare, ...verifyUserResume);

export default profileRoute;
