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
		? process.env.TRUSTED_ORIGINS.split(',')
		: ['http://localhost:5173'],
	emailAndPassword: {
		enabled: true,
		minPasswordLength: 8,
		requireEmailVerification: true,
		sendResetPasswordEmail: true,
		revokeSessionsOnPasswordReset: true,
		sendResetPassword: async ({ user, url }) => {
			void emailSender.sendResetPasswordEmail(user.name, user.email, url);
		},
	},
	session: {
		cookieCache: {
			enabled: true,
			maxAge: 5 * 60, // 5 minutes
		},
	},
	rateLimit: {
		window: 15 * 60 * 1000, // 15 minutes
		max: 100, // limit each IP to 100 requests per windowMs
	},
	emailVerification: {
		sendOnSignUp: true,
		sendVerificationEmail: async ({ user, url }) => {
			void emailSender.sendVerificationEmail(user.name, user.email, url);
		},
		afterEmailVerification: async ({ id, name }) => {
			await db
				.insert(profileSchema)
				.values({ user_id: id, full_name: name })
				.onConflictDoNothing();
		},
	},
});
