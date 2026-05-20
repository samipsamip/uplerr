import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { auth } from './lib/auth';
import { authMiddleWare } from './lib/middleware';

export function buildApp() {
	const app = new Hono<{
		Variables: {
			user: typeof auth.$Infer.Session.user;
			session: typeof auth.$Infer.Session.session;
		};
	}>();

	const allowedOrigins = process.env.TRUSTED_ORIGINS
		? process.env.TRUSTED_ORIGINS.split(',')
		: ['http://localhost:5173'];

	app.use(
		'*',
		cors({
			origin: allowedOrigins,
			allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
			allowHeaders: ['Content-Type', 'Authorization'],
			credentials: true,
			maxAge: 600,
		}),
	);

	app.on(['POST', 'GET'], '/api/auth/*', async (c, next) => {
		await auth.handler(c.req.raw);
		await next();
	});
	app.get('/me', authMiddleWare, (c) => {
		return c.json(201);
	});
	app.get('/', (c) => c.text('Hello Hono!'));

	return app;
}
