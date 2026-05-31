import { factory } from '../../lib/factory';
import { authMiddleWare } from '../../lib/middleware';
import { addRoadmapForUser, getUserRoadmaps } from './roadmaps.controller';

const roadMapsRoute = factory.createApp();

roadMapsRoute.get('/:userId', authMiddleWare, ...getUserRoadmaps);
roadMapsRoute.post('/:userId', authMiddleWare, ...addRoadmapForUser);

export default roadMapsRoute;
