import { eq } from 'drizzle-orm';

import { profileSchema } from '../schemas/profiles.schema';
import db from '../utils/db';
import { auth } from './auth';
import { factory } from './factory';

export const authMiddleWare = factory.createMiddleware(async (c, next) => {
	const authSession = await auth.api.getSession({ headers: c.req.raw.headers });
	if (!authSession?.session?.token) {
		return c.json({ message: 'Unauthorized' }, 401);
	}
	const { user, session } = authSession;

	const [profile] = await db
		.select({ id: profileSchema.id })
		.from(profileSchema)
		.where(eq(profileSchema.user_id, user.id))
		.limit(1);

	if (!profile) {
		return c.json({ message: 'Profile not found' }, 404);
	}

	c.set('user', user);
	c.set('session', session);
	c.set('profileId', profile.id);
	await next();
});
