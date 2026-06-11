import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';

import { factory } from '../../lib/factory';
import { joinWaitlist } from './waitlist.service';

const waitlistRoute = factory.createApp();

waitlistRoute.post(
	'/',
	zValidator('json', z.object({ email: z.string().email() })),
	async (c) => {
		const { email } = c.req.valid('json');
		const { alreadyExists } = await joinWaitlist(email);
		return c.json({ success: true, alreadyExists }, 200);
	},
);

export default waitlistRoute;
