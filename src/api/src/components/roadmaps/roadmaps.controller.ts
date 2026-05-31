import { factory } from '../../lib/factory';

export const getUserRoadmaps = factory.createHandlers(async (c) => {
	return c.json(
		{
			message: 'ok',
		},
		200,
	);
});

export const addRoadmapForUser = factory.createHandlers(async (c) => {
	return c.json(
		{
			message: 'ok',
		},
		200,
	);
});
