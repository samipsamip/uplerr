import { and, eq } from 'drizzle-orm';

import { factory } from '../../lib/factory';
import { adminTokensSchema } from '../../schemas/admin_tokens.schema';
import { user } from '../../schemas/auth-schema';
import { profileSchema } from '../../schemas/profiles.schema';
import db from '../../utils/db';

const adminRoute = factory.createApp();

adminRoute.use('*', async (c, next) => {
	const authorization = c.req.header('Authorization');
	if (!authorization?.startsWith('Basic ')) {
		return c.json({ message: 'Forbidden' }, 403);
	}

	const decoded = atob(authorization.slice(6));
	const colon = decoded.indexOf(':');
	if (colon === -1) {
		return c.json({ message: 'Forbidden' }, 403);
	}

	const adminEmail = decoded.slice(0, colon);
	const adminToken = decoded.slice(colon + 1);

	const [record] = await db
		.select({ id: adminTokensSchema.id })
		.from(adminTokensSchema)
		.where(
			and(
				eq(adminTokensSchema.user_email, adminEmail),
				eq(adminTokensSchema.token, adminToken),
			),
		)
		.limit(1);

	if (!record) {
		return c.json({ message: 'Forbidden' }, 403);
	}

	await next();
});

adminRoute.get('/users', async (c) => {
	const users = await db
		.select({
			userId: user.id,
			name: user.name,
			email: user.email,
			emailVerified: user.emailVerified,
			isBanned: profileSchema.is_banned,
			banReason: profileSchema.ban_reason,
			joinedAt: profileSchema.created_at,
		})
		.from(profileSchema)
		.innerJoin(user, eq(profileSchema.user_id, user.id))
		.orderBy(profileSchema.created_at);

	return c.json(users);
});

adminRoute.patch('/users/:userId/ban', async (c) => {
	const userId = c.req.param('userId');
	const body = await c.req.json<{ reason?: string }>();

	const [updated] = await db
		.update(profileSchema)
		.set({ is_banned: true, ban_reason: body.reason ?? null })
		.where(eq(profileSchema.user_id, userId))
		.returning({ id: profileSchema.id });

	if (!updated) {
		return c.json({ message: 'User not found' }, 404);
	}

	return c.json({ success: true });
});

adminRoute.patch('/users/:userId/unban', async (c) => {
	const userId = c.req.param('userId');

	const [updated] = await db
		.update(profileSchema)
		.set({ is_banned: false, ban_reason: null })
		.where(eq(profileSchema.user_id, userId))
		.returning({ id: profileSchema.id });

	if (!updated) {
		return c.json({ message: 'User not found' }, 404);
	}

	return c.json({ success: true });
});

export default adminRoute;
