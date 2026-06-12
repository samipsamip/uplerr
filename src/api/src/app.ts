import './lib/logger';

import { cors } from 'hono/cors';

import adminRoute from './components/admin/admin.route';
import profileRoute from './components/profiles/profiles.route';
import roadMapsRoute from './components/roadmaps/roadmaps.route';
import scraperRoute from './components/scraper/scraper.route';
import skillsRoute from './components/skills/skills.route';
import waitlistRoute from './components/waitlist/waitlist.route';
import { auth } from './lib/auth';
import { factory } from './lib/factory';
import { authMiddleWare } from './lib/middleware';

export function buildApp() {
	const app = factory.createApp();
	const allowedOrigins = process.env.TRUSTED_ORIGINS
		? process.env.TRUSTED_ORIGINS.split(',').map((o) => o.trim())
		: ['http://localhost:5173'];

	const corsMiddleware = cors({
		origin: allowedOrigins,
		allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
		allowHeaders: ['Content-Type', 'Authorization'],
		credentials: true,
		maxAge: 600,
	});

	// better-auth sets its own CORS headers on /api/auth/* via trustedOrigins —
	// applying Hono's middleware there too would duplicate Access-Control-Allow-Origin
	app.use('*', (c, next) => {
		if (c.req.path.startsWith('/api/auth')) return next();
		return corsMiddleware(c, next);
	});

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
	app.route('/api/skills', skillsRoute);
	app.route('/api/roadmaps', roadMapsRoute);
	app.route('/api/scraper', scraperRoute);
	app.route('/api/waitlist', waitlistRoute);
	app.route('/api/admin', adminRoute);

	app.use('*', async (c) => c.json({ message: 'Not Found' }, 404));
	return app;
}
