import { cors } from 'hono/cors';
import profileRoute from './components/profiles/profiles.route';
import { auth } from './lib/auth';
import { factory } from './lib/factory';
import { authMiddleWare } from './lib/middleware';
export function buildApp() {
	const app = factory.createApp();
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

	app.on(['POST', 'GET'], '/api/auth/*', (c) => auth.handler(c.req.raw));
	app.get('/me', authMiddleWare, (c) => {
		return c.json(
			{
				...c.get('user'),
			},
			200,
		);
	});
	app.route('/api/profile', profileRoute);
	app.use('*', async (c) => c.json({ message: 'Not Found' }, 404));
	return app;
}
