import './lib/logger';

import { cors } from 'hono/cors';

import profileRoute from './components/profiles/profiles.route';
import roadMapsRoute from './components/roadmaps/roadmaps.route';
import skillsRoute from './components/skills/skills.route';
import { auth } from './lib/auth';
import { factory } from './lib/factory';
import { authMiddleWare } from './lib/middleware';
import pdfParser from './lib/pdf-parser';

export function buildApp() {
	const app = factory.createApp();
	const allowedOrigins = process.env.TRUSTED_ORIGINS
		? process.env.TRUSTED_ORIGINS.split(',')
		: ['http://localhost:5173'];

	app.use(
		'*',
		cors({
			origin: allowedOrigins,
			allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
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
	app.route('/api/skills', skillsRoute);
	app.route('/api/roadmaps', roadMapsRoute);

	app.post('/api/debug/parse-pdf', async (c) => {
		const formData = await c.req.formData();
		const file = formData.get('file');
		if (!file || !(file instanceof File)) {
			return c.json({ message: 'Please provide a PDF file.' }, 400);
		}
		const buffer = new Uint8Array(await file.arrayBuffer());
		try {
			const result = await pdfParser.parse(buffer);
			return c.json(result, 200);
		} catch (err) {
			return c.json(
				{ message: err instanceof Error ? err.message : 'Parse failed.' },
				400,
			);
		}
	});

	app.use('*', async (c) => c.json({ message: 'Not Found' }, 404));
	return app;
}
