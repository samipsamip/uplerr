import { factory } from '../../lib/factory';
import { authMiddleWare } from '../../lib/middleware';
import {
	addResource,
	deleteRoadmap,
	getRoadmap,
	getRoadmapGenerationStatus,
	getUserRoadmaps,
	patchRoadmapStatus,
	startRoadmapGeneration,
} from './roadmaps.controller';

const roadMapsRoute = factory.createApp();

roadMapsRoute.post('/generate', authMiddleWare, ...startRoadmapGeneration);
roadMapsRoute.get(
	'/generate/:jobId/status',
	authMiddleWare,
	...getRoadmapGenerationStatus,
);
roadMapsRoute.get('/', authMiddleWare, ...getUserRoadmaps);
roadMapsRoute.get('/:planId', authMiddleWare, ...getRoadmap);
roadMapsRoute.patch('/:planId/status', authMiddleWare, ...patchRoadmapStatus);
roadMapsRoute.delete('/:planId', authMiddleWare, ...deleteRoadmap);
roadMapsRoute.post('/:planId/resources', authMiddleWare, ...addResource);

export default roadMapsRoute;
