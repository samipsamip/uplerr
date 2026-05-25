import { drizzle } from 'drizzle-orm/pglite';
import { migrate } from 'drizzle-orm/pglite/migrator';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PGlite } from '@electric-sql/pglite';

import { user } from '../../schemas/auth-schema';
import { profileSchema } from '../../schemas/profiles.schema';

const migrationsFolder = path.join(
	path.dirname(fileURLToPath(import.meta.url)),
	'../../../drizzle',
);

export type TestDb = ReturnType<typeof drizzle>;

export const createTestDb = async (): Promise<TestDb> => {
	const client = new PGlite();
	const db = drizzle(client);
	await migrate(db, { migrationsFolder });
	return db;
};

// Inserts the minimum parent rows required to satisfy FK constraints.
// Returns the profileId to use when seeding domain tables in tests.
export const seedProfile = async (
	db: TestDb,
	overrides?: { userId?: string; profileId?: string },
): Promise<{ userId: string; profileId: string }> => {
	const userId = overrides?.userId ?? crypto.randomUUID();
	const profileId = overrides?.profileId ?? crypto.randomUUID();

	await db.insert(user).values({
		id: userId,
		name: 'Test User',
		email: `${userId}@test.com`,
		emailVerified: false,
		createdAt: new Date(),
		updatedAt: new Date(),
	});

	await db.insert(profileSchema).values({
		id: profileId,
		user_id: userId,
	});

	return { userId, profileId };
};
