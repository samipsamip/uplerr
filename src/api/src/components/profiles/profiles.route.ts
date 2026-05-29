import { factory } from '../../lib/factory';
import { authMiddleWare } from '../../lib/middleware';
import {
	createUserProfile,
	getUserProfile,
	verifyUserResume,
} from './profiles.controller';

const profileRoute = factory.createApp();

profileRoute.get('/', authMiddleWare, ...getUserProfile);
profileRoute.post('/upload-resume', authMiddleWare, ...createUserProfile);
profileRoute.patch('/resume', authMiddleWare, ...verifyUserResume);

export default profileRoute;
