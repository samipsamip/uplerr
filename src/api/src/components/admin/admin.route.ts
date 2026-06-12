import { and, eq } from 'drizzle-orm';

import { factory } from '../../lib/factory';
import { adminTokensSchema } from '../../schemas/admin_tokens.schema';
import { user } from '../../schemas/auth-schema';
import { profileSchema } from '../../schemas/profiles.schema';
import db from '../../utils/db';
import { emailSender } from '../../utils/email_utils';

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
			isApproved: profileSchema.is_approved,
			isBanned: profileSchema.is_banned,
			joinedAt: profileSchema.created_at,
		})
		.from(profileSchema)
		.innerJoin(user, eq(profileSchema.user_id, user.id))
		.orderBy(profileSchema.created_at);

	return c.json(users);
});

adminRoute.patch('/users/:userId/approve', async (c) => {
	const userId = c.req.param('userId');

	const [targetUser] = await db
		.select({ name: user.name, email: user.email })
		.from(user)
		.where(eq(user.id, userId))
		.limit(1);

	if (!targetUser) {
		return c.json({ message: 'User not found' }, 404);
	}

	const [updated] = await db
		.update(profileSchema)
		.set({ is_approved: true })
		.where(eq(profileSchema.user_id, userId))
		.returning({ id: profileSchema.id });

	if (!updated) {
		return c.json(
			{ message: 'Profile not found — has the user verified their email?' },
			404,
		);
	}

	emailSender
		.sendApprovalEmail(targetUser.name, targetUser.email)
		.catch(() => {});

	return c.json({ success: true });
});

export default adminRoute;
