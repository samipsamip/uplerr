import { and, eq, isNull, sql } from 'drizzle-orm';
import type {
	JobAnalysisResultType,
	RoadmapCurriculumType,
} from '@uppler/types';

import { braintrust } from '../../lib/lllm/braintrust';
import { studyPlanSchema } from '../../schemas/study_plans.schema';
import db from '../../utils/db';

// ---------------------------------------------------------------------------
// Generate + persist
// ---------------------------------------------------------------------------

export async function generateAndSaveRoadmap(
	analysis: JobAnalysisResultType,
	profileId: string,
	onStage: (stage: string) => void = () => {},
	weeklyHours = 10,
	timelineTarget: string | null = null,
): Promise<{ id: string }> {
	const skillGaps = analysis.skills
		.filter((s) => s.user_level === 'none' || s.user_level !== s.required_level)
		.map((s) => ({
			name: s.name,
			required_level: s.required_level,
			user_level: s.user_level,
		}));

	onStage('generating');
	const curriculum = await braintrust.generateRoadmapCurriculum(
		{
			job_title: analysis.job_title,
			company: analysis.company,
			weekly_hours: weeklyHours,
			timeline_target: timelineTarget,
			skill_gaps: skillGaps,
		},
		profileId,
	);

	onStage('saving');
	const [saved] = await db
		.insert(studyPlanSchema)
		.values({
			profile_id: profileId,
			job_title: analysis.job_title,
			company: analysis.company,
			weekly_hours: weeklyHours,
			timeline_target: timelineTarget,
			extracted_skills: curriculum as unknown as Record<string, unknown>,
			status: 'active',
		})
		.returning({ id: studyPlanSchema.id });

	return { id: saved.id };
}

// ---------------------------------------------------------------------------
// Update status
// ---------------------------------------------------------------------------

export async function updateRoadmapStatus(
	planId: string,
	profileId: string,
	status: 'active' | 'completed' | 'archived',
): Promise<boolean> {
	const result = await db
		.update(studyPlanSchema)
		.set({ status, updated_at: sql`now()` })
		.where(
			and(
				eq(studyPlanSchema.id, planId),
				eq(studyPlanSchema.profile_id, profileId),
				isNull(studyPlanSchema.deleted_at),
			),
		)
		.returning({ id: studyPlanSchema.id });

	return result.length > 0;
}

// ---------------------------------------------------------------------------
// Delete (soft)
// ---------------------------------------------------------------------------

export async function deleteRoadmap(
	planId: string,
	profileId: string,
): Promise<boolean> {
	const result = await db
		.update(studyPlanSchema)
		.set({ deleted_at: sql`now()` })
		.where(
			and(
				eq(studyPlanSchema.id, planId),
				eq(studyPlanSchema.profile_id, profileId),
				isNull(studyPlanSchema.deleted_at),
			),
		)
		.returning({ id: studyPlanSchema.id });

	return result.length > 0;
}

// ---------------------------------------------------------------------------
// Add user resource to subtopic
// ---------------------------------------------------------------------------

export async function addSubtopicResource(
	planId: string,
	profileId: string,
	topicOrder: number,
	subtopicTitle: string,
	resource: { title: string; url: string },
): Promise<boolean> {
	const [row] = await db
		.select()
		.from(studyPlanSchema)
		.where(
			and(
				eq(studyPlanSchema.id, planId),
				eq(studyPlanSchema.profile_id, profileId),
				isNull(studyPlanSchema.deleted_at),
			),
		)
		.limit(1);

	if (!row) return false;

	const curriculum = row.extracted_skills as unknown as RoadmapCurriculumType;
	const updated: RoadmapCurriculumType = {
		...curriculum,
		topics: curriculum.topics.map((t) => {
			if (t.order !== topicOrder) return t;
			return {
				...t,
				subtopics: t.subtopics.map((s) => {
					if (s.title !== subtopicTitle) return s;
					return {
						...s,
						user_resources: [...(s.user_resources ?? []), resource],
					};
				}),
			};
		}),
	};

	await db
		.update(studyPlanSchema)
		.set({ extracted_skills: updated as unknown as Record<string, unknown> })
		.where(eq(studyPlanSchema.id, planId));

	return true;
}

// ---------------------------------------------------------------------------
// Read
// ---------------------------------------------------------------------------

export type SavedRoadmap = {
	id: string;
	job_title: string | null;
	company: string | null;
	status: 'active' | 'completed' | 'archived';
	estimated_weeks: number | null;
	topic_count: number;
	subtopic_count: number;
	created_at: Date;
};

export async function listRoadmaps(profileId: string): Promise<SavedRoadmap[]> {
	const rows = await db
		.select()
		.from(studyPlanSchema)
		.where(
			and(
				eq(studyPlanSchema.profile_id, profileId),
				isNull(studyPlanSchema.deleted_at),
			),
		)
		.orderBy(studyPlanSchema.created_at);

	return rows.map((r) => {
		const curriculum = r.extracted_skills as unknown as RoadmapCurriculumType;
		const subtopicCount =
			curriculum?.topics?.reduce(
				(n: number, t) => n + (t.subtopics?.length ?? 0),
				0,
			) ?? 0;
		return {
			id: r.id,
			job_title: r.job_title,
			company: r.company,
			status: r.status,
			estimated_weeks: curriculum?.estimated_weeks ?? null,
			topic_count: curriculum?.topics?.length ?? 0,
			subtopic_count: subtopicCount,
			created_at: r.created_at,
		};
	});
}

export async function getRoadmapById(
	planId: string,
	profileId: string,
): Promise<(SavedRoadmap & { roadmap: RoadmapCurriculumType }) | null> {
	const [row] = await db
		.select()
		.from(studyPlanSchema)
		.where(
			and(
				eq(studyPlanSchema.id, planId),
				eq(studyPlanSchema.profile_id, profileId),
				isNull(studyPlanSchema.deleted_at),
			),
		)
		.limit(1);

	if (!row) return null;

	const curriculum = row.extracted_skills as unknown as RoadmapCurriculumType;
	const subtopicCount =
		curriculum?.topics?.reduce((n, t) => n + (t.subtopics?.length ?? 0), 0) ??
		0;
	return {
		id: row.id,
		job_title: row.job_title,
		company: row.company,
		status: row.status,
		estimated_weeks: curriculum?.estimated_weeks ?? null,
		topic_count: curriculum?.topics?.length ?? 0,
		subtopic_count: subtopicCount,
		created_at: row.created_at,
		roadmap: curriculum,
	};
}
