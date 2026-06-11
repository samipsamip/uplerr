import { z } from 'zod';

import { factory } from '../../lib/factory';
import {
	addSubtopicResource,
	deleteRoadmap as deleteRoadmapService,
	generateAndSaveRoadmap,
	getRoadmapById,
	listRoadmaps,
	updateRoadmapStatus,
} from './roadmaps.service';

// ---------------------------------------------------------------------------
// Job state — same in-memory pattern as the scraper worker
// ---------------------------------------------------------------------------

export type RoadmapJobState =
	| { status: 'pending' }
	| { status: 'processing'; stage: string }
	| { status: 'done'; planId: string }
	| { status: 'error'; message: string };

const jobs = new Map<string, RoadmapJobState>();

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

const GenerateRoadmapSchema = z.object({
	company: z.string().nullable(),
	job_title: z.string().nullable(),
	weekly_hours: z.number().int().min(1).max(80).default(10),
	timeline_target: z.string().nullable().default(null),
	skills: z.array(
		z.object({
			name: z.string(),
			required_level: z.enum([
				'beginner',
				'intermediate',
				'advanced',
				'expert',
			]),
			user_level: z.string(),
		}),
	),
});

// ---------------------------------------------------------------------------
// Handlers
// ---------------------------------------------------------------------------

export const getUserRoadmaps = factory.createHandlers(async (c) => {
	const profileId = c.get('profileId');
	const roadmaps = await listRoadmaps(profileId);
	return c.json(roadmaps);
});

export const getRoadmap = factory.createHandlers(async (c) => {
	const profileId = c.get('profileId');
	const planId = c.req.param('planId') ?? '';
	const result = await getRoadmapById(planId, profileId);
	if (!result) return c.json({ error: 'Not found' }, 404);
	return c.json(result);
});

export const startRoadmapGeneration = factory.createHandlers(async (c) => {
	const profileId = c.get('profileId');
	const body = await c.req.json();
	const parsed = GenerateRoadmapSchema.safeParse(body);

	if (!parsed.success) {
		return c.json(
			{ error: 'Invalid payload', details: parsed.error.flatten() },
			400,
		);
	}

	const jobId = crypto.randomUUID();
	jobs.set(jobId, { status: 'pending' });

	void (async () => {
		try {
			const { id } = await generateAndSaveRoadmap(
				parsed.data,
				profileId,
				(stage) => jobs.set(jobId, { status: 'processing', stage }),
				parsed.data.weekly_hours,
				parsed.data.timeline_target,
			);
			jobs.set(jobId, { status: 'done', planId: id });
		} catch (err) {
			const message = err instanceof Error ? err.message : 'Unknown error';
			jobs.set(jobId, { status: 'error', message });
		}
	})();

	return c.json({ jobId }, 202);
});

const UpdateStatusSchema = z.object({
	status: z.enum(['active', 'completed', 'archived']),
});

export const patchRoadmapStatus = factory.createHandlers(async (c) => {
	const profileId = c.get('profileId');
	const planId = c.req.param('planId') ?? '';
	const body = await c.req.json();
	const parsed = UpdateStatusSchema.safeParse(body);
	if (!parsed.success) return c.json({ error: 'Invalid status' }, 400);

	const success = await updateRoadmapStatus(
		planId,
		profileId,
		parsed.data.status,
	);
	if (!success) return c.json({ error: 'Not found' }, 404);
	return c.json({ success: true });
});

export const deleteRoadmap = factory.createHandlers(async (c) => {
	const profileId = c.get('profileId');
	const planId = c.req.param('planId') ?? '';
	const success = await deleteRoadmapService(planId, profileId);
	if (!success) return c.json({ error: 'Not found' }, 404);
	return c.json({ success: true });
});

const AddResourceSchema = z.object({
	topic_order: z.number().int(),
	subtopic_title: z.string(),
	resource: z.object({
		title: z.string().min(1),
		url: z.string().url(),
	}),
});

export const addResource = factory.createHandlers(async (c) => {
	const profileId = c.get('profileId');
	const planId = c.req.param('planId') ?? '';
	const body = await c.req.json();
	const parsed = AddResourceSchema.safeParse(body);
	if (!parsed.success)
		return c.json(
			{ error: 'Invalid payload', details: parsed.error.flatten() },
			400,
		);

	const success = await addSubtopicResource(
		planId,
		profileId,
		parsed.data.topic_order,
		parsed.data.subtopic_title,
		parsed.data.resource,
	);

	if (!success) return c.json({ error: 'Not found' }, 404);
	return c.json({ success: true });
});

export const getRoadmapGenerationStatus = factory.createHandlers(async (c) => {
	const jobId = c.req.param('jobId') ?? '';
	const job = jobs.get(jobId);

	if (!job) return c.json({ error: 'Job not found' }, 404);

	if (job.status === 'done' || job.status === 'error') {
		jobs.delete(jobId);
	}

	return c.json(job);
});
