import { createFactory } from 'hono/factory';

import type { auth } from './auth';

export type Env = {
	Variables: {
		user: typeof auth.$Infer.Session.user;
		session: typeof auth.$Infer.Session.session;
		profileId: string;
	};
};

export const factory = createFactory<Env>();
