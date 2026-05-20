import { createMiddleware } from 'hono/factory';
import { auth } from './auth';

export const authMiddleWare = createMiddleware(async (c, next) => {
	const authSession = await auth.api.getSession({ headers: c.req.raw.headers });
	if (!authSession?.session?.token) {
		return c.json({ message: 'Unauthorized' }, 401);
	}
	const { user, session } = authSession;
	c.set('user', user);
	c.set('session', session);
	await next();
});
