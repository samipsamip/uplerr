import { factory } from '../../lib/factory';

export const scrapeJobDetails = factory.createHandlers(async (c) => {
	return c.json(
		{
			message: 'OK',
		},
		200,
	);
});
