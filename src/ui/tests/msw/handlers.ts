import { http, HttpResponse } from 'msw';
import type { UserSkill } from '@uppler/types';

export const BASE = 'http://localhost:3000';

export const mockSkill: UserSkill = {
	id: 'skill-1',
	name: 'TypeScript',
	category: 'Frontend',
	level: 'expert',
	source: 'manual',
};

export const mockProfile = {
	id: 'profile-1',
	full_name: 'Test User',
	cv: null as null | {
		filename: string;
		hasStructuredData: boolean;
		uploadedAt: string;
	},
	cv_generations_used: 0,
	study_plans_used: 0,
	subscription_tier: 'free' as const,
	usage_reset_at: null as string | null,
};

export const handlers = [
	// Skills
	http.get(`${BASE}/api/skills`, () => HttpResponse.json([])),

	http.post(`${BASE}/api/skills/add-skills`, async ({ request }) => {
		const body = await request.json();
		return HttpResponse.json(
			{ id: 'new-skill', ...(body as object), source: 'manual' },
			{ status: 201 },
		);
	}),

	http.put(`${BASE}/api/skills/update-skills/:skillId`, async ({ request }) => {
		const body = await request.json();
		return HttpResponse.json({ ...mockSkill, ...(body as object) });
	}),

	http.delete(`${BASE}/api/skills/delete-skills/:skillId`, () =>
		HttpResponse.json({ message: 'Skill deleted.' }),
	),

	// Profile
	http.get(`${BASE}/api/profile`, () => HttpResponse.json(mockProfile)),

	http.post(`${BASE}/api/profile/upload-resume`, () =>
		HttpResponse.json(
			{ message: 'CV uploaded successfully.' },
			{ status: 201 },
		),
	),

	http.post(`${BASE}/api/profile/update-resume`, () =>
		HttpResponse.json(
			{ message: 'CV replaced successfully.' },
			{ status: 201 },
		),
	),
];
