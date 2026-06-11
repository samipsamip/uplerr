import { serve } from '@hono/node-server';

import { buildApp } from './app';
import { pool } from './utils/db';

const server = serve(
	{
		fetch: buildApp().fetch,
		port: 3000,
	},
	(info) => {
		console.log(`Server running on port ${info.port}`);
	},
);

const shutdown = () => {
	server.close(async () => {
		await pool.end();
		process.exit(0);
	});
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
