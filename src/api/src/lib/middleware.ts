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
		.select({
			id: profileSchema.id,
			is_approved: profileSchema.is_approved,
			is_banned: profileSchema.is_banned,
			ban_reason: profileSchema.ban_reason,
		})
		.from(profileSchema)
		.where(eq(profileSchema.user_id, user.id))
		.limit(1);

	if (!profile) {
		return c.json({ message: 'Profile not found' }, 404);
	}

	if (!profile.is_approved) {
		return c.json(
			{
				message:
					'Your account is pending approval. You will be notified once you have been granted access.',
				code: 'PENDING_APPROVAL',
			},
			403,
		);
	}

	if (profile.is_banned) {
		return c.json(
			{
				message:
					profile.ban_reason ??
					'Your account has been suspended. Please contact support.',
				code: 'BANNED',
			},
			403,
		);
	}

	c.set('user', user);
	c.set('session', session);
	c.set('profileId', profile.id);
	await next();
});
