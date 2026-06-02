import type { ValidationTargets } from 'hono';
import { HTTPException } from 'hono/http-exception';
import * as z from 'zod';
import { zValidator as zv } from '@hono/zod-validator';

export const zValidator = <
	T extends z.ZodSchema,
	Target extends keyof ValidationTargets,
>(
	target: Target,
	schema: T,
) =>
	zv(target, schema, (result, _c) => {
		if (!result.success) {
			const { fieldErrors, formErrors } = z.flattenError(result.error);
			throw new HTTPException(400, {
				message: JSON.stringify({ fieldErrors, formErrors }),
			});
		}
	});
