import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';

import { account, session, user, verification } from '../schemas/auth-schema';
import { profileSchema } from '../schemas/profiles.schema';
import db from '../utils/db';
import { emailSender } from '../utils/email_utils';

export const auth = betterAuth({
	database: drizzleAdapter(db, {
		provider: 'pg',
		schema: { user, session, account, verification },
	}),
	baseURL: process.env.AUTH_BASE_URL ?? 'http://localhost:3000/',
	trustedOrigins: process.env.TRUSTED_ORIGINS
		? process.env.TRUSTED_ORIGINS.split(',').map((o) => o.trim())
		: ['http://localhost:5173'],
	emailAndPassword: {
		enabled: true,
		minPasswordLength: 8,
		requireEmailVerification: false,
		sendResetPasswordEmail: true,
		revokeSessionsOnPasswordReset: true,
		sendResetPassword: async ({ user, url }) => {
			void emailSender.sendResetPasswordEmail(user.name, user.email, url);
		},
	},
	emailVerification: {
		sendOnSignUp: true,
		sendVerificationEmail: async ({ user, url }) => {
			void emailSender.sendVerificationEmail(user.name, user.email, url);
		},
	},
	databaseHooks: {
		user: {
			create: {
				after: async (user) => {
					await db
						.insert(profileSchema)
						.values({ user_id: user.id, full_name: user.name })
						.onConflictDoNothing();
				},
			},
		},
	},
	session: {
		cookieCache: {
			enabled: true,
			maxAge: 5 * 60,
		},
	},
	rateLimit: {
		window: 15 * 60 * 1000,
		max: 100,
	},
});
