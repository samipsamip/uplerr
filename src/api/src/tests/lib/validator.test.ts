import { Hono } from 'hono';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import { zValidator } from '../../lib/validator';

const schema = z.object({ name: z.string(), age: z.number().int().positive() });

const app = new Hono();
app.post('/test', zValidator('json', schema), (c) => c.json({ ok: true }));

const post = (body: unknown) =>
	app.request('/test', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(body),
	});

describe('zValidator', () => {
	it('passes valid data through to the handler', async () => {
		const res = await post({ name: 'Alice', age: 30 });
		expect(res.status).toBe(200);
		expect(await res.json()).toEqual({ ok: true });
	});

	it('returns 400 for invalid data', async () => {
		const res = await post({ name: 'Alice', age: 'not-a-number' });
		expect(res.status).toBe(400);
	});

	it('includes fieldErrors in the 400 response body', async () => {
		const res = await post({ name: 'Alice', age: -1 });
		const body = await res.json();
		expect(body).toHaveProperty('fieldErrors');
	});

	it('returns 400 when required fields are missing', async () => {
		const res = await post({ name: 'Alice' });
		expect(res.status).toBe(400);
	});
});
