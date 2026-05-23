import { type AnyColumn, isNull } from 'drizzle-orm';

export const notDeleted = <T extends { deleted_at: AnyColumn }>(table: T) =>
	isNull(table.deleted_at);
