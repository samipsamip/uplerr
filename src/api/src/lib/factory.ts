import { createFactory } from 'hono/factory';

import type { auth } from './auth';

type Env = {
	Variables: {
		user: typeof auth.$Infer.Session.user;
		session: typeof auth.$Infer.Session.session;
	};
};

export const factory = createFactory<Env>();
