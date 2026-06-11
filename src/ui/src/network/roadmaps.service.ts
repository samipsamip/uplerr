import type { RoadmapCurriculumType } from '@uppler/types';

import { api } from './client';

export type SavedRoadmap = {
	id: string;
	job_title: string | null;
	company: string | null;
	status: 'active' | 'completed' | 'archived';
	estimated_weeks: number | null;
	topic_count: number;
	subtopic_count: number;
	created_at: string;
};

export type RoadmapDetail = SavedRoadmap & {
	roadmap: RoadmapCurriculumType;
};

type GeneratePayload = {
	company: string | null;
	job_title: string | null;
	weekly_hours: number;
	timeline_target: string | null;
	skills: Array<{
		name: string;
		required_level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
		user_level: string;
	}>;
};

export type RoadmapJobState =
	| { status: 'pending' }
	| { status: 'processing'; stage: string }
	| { status: 'done'; planId: string }
	| { status: 'error'; message: string };

export const postStartRoadmapGeneration = (payload: GeneratePayload) =>
	api
		.post('api/roadmaps/generate', { json: payload })
		.json<{ jobId: string }>();

export const getRoadmapGenerationStatus = (jobId: string) =>
	api.get(`api/roadmaps/generate/${jobId}/status`).json<RoadmapJobState>();

export const getRoadmaps = () => api.get('api/roadmaps').json<SavedRoadmap[]>();

export const getRoadmap = (planId: string) =>
	api.get(`api/roadmaps/${planId}`).json<RoadmapDetail>();

export const patchRoadmapStatus = (
	planId: string,
	status: 'active' | 'completed' | 'archived',
) =>
	api
		.patch(`api/roadmaps/${planId}/status`, { json: { status } })
		.json<{ success: boolean }>();

export const deleteRoadmap = (planId: string) =>
	api.delete(`api/roadmaps/${planId}`).json<{ success: boolean }>();

export const addSubtopicResource = (
	planId: string,
	payload: {
		topic_order: number;
		subtopic_title: string;
		resource: { title: string; url: string };
	},
) =>
	api
		.post(`api/roadmaps/${planId}/resources`, { json: payload })
		.json<{ success: boolean }>();
