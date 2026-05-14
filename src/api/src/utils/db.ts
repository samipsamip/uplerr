import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

const db = drizzle(
	new Pool({ connectionString: process.env.DATABASE_URL ?? '' }),
);

export default db;
