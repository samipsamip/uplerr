import type {
	CvStructuredData,
	ResumeExtractionType,
	SkillExtractionType,
} from '@uppler/types';

import {
	lookupSkillCategory,
	SKILL_CATEGORY_ORDER,
	type SkillCategory,
} from '@/data/skill-catalog';

export type { SkillCategory };
export { SKILL_CATEGORY_ORDER };

export function flattenSkills(skills: SkillExtractionType): string[] {
	return [
		...skills.technical_skills,
		...skills.tools_platforms,
		...skills.spoken_languages,
		...skills.soft_skills,
	].map((s) => s.name);
}

export function categorizeSkills(
	skills: string[],
	overrides?: Record<string, string>,
): [string, string[]][] {
	const result = new Map<string, string[]>();
	const assigned = new Set<string>();

	for (const category of SKILL_CATEGORY_ORDER) {
		for (const skill of skills) {
			if (assigned.has(skill)) continue;
			const effectiveCategory =
				overrides?.[skill] ?? lookupSkillCategory(skill);
			if (effectiveCategory === category) {
				const bucket = result.get(category) ?? [];
				bucket.push(skill);
				result.set(category, bucket);
				assigned.add(skill);
			}
		}
	}

	const other = skills.filter((s) => !assigned.has(s));
	if (other.length > 0) {
		const existing = result.get('Other') ?? [];
		result.set('Other', [...existing, ...other]);
	}

	return Array.from(result.entries());
}

export function computeProfileStrength(data: CvStructuredData): number {
	let score = 0;
	const { extraction, skills } = data;
	const cd = extraction.contact_details;

	if (extraction.full_name) score += 10;
	if (cd.email) score += 10;
	if (cd.phone) score += 5;
	if (cd.location) score += 5;
	if (cd.linkedin) score += 4;
	if (cd.vcs_url) score += 4;
	if (cd.portfolio) score += 2;

	const allSkills = flattenSkills(skills);
	score += Math.min(allSkills.length * 1.2, 24);

	if (extraction.work_history.length > 0) score += 15;
	if (extraction.work_history.length > 1) score += 5;
	extraction.work_history.forEach((e) => {
		if (e.bullet_points.length >= 2) score += 3;
	});

	if (extraction.education.length > 0) score += 7;
	return Math.min(Math.round(score), 100);
}

export function detectProfileType(skills: SkillExtractionType): string {
	const lower = flattenSkills(skills).map((s) => s.toLowerCase());
	const backend = lower.filter((s) =>
		[
			'node',
			'python',
			'java',
			'go',
			'rust',
			'express',
			'fastapi',
			'django',
			'hono',
			'php',
			'ruby',
		].some((k) => s.includes(k)),
	).length;
	const frontend = lower.filter((s) =>
		[
			'react',
			'vue',
			'angular',
			'svelte',
			'next',
			'typescript',
			'javascript',
		].some((k) => s.includes(k)),
	).length;
	const cloud = lower.filter((s) =>
		[
			'aws',
			'gcp',
			'azure',
			'terraform',
			'kubernetes',
			'docker',
			'cloudwatch',
			'cloudbuild',
		].some((k) => s.includes(k)),
	).length;
	if (backend >= 2 && cloud >= 3)
		return 'Full-stack engineer with strong cloud experience';
	if (cloud >= 4) return 'Cloud & infrastructure profile detected';
	if (backend >= 3 && frontend >= 2)
		return 'Full-stack engineer profile detected';
	if (backend >= 3) return 'Strong backend profile detected';
	if (frontend >= 3) return 'Frontend-focused profile detected';
	return 'Software engineering profile detected';
}

export function strengthLabel(
	score: number,
): 'Excellent' | 'Strong' | 'Good' | 'Building' {
	if (score >= 85) return 'Excellent';
	if (score >= 70) return 'Strong';
	if (score >= 50) return 'Good';
	return 'Building';
}

export function estimateYearsOfExperience(
	workHistory: ResumeExtractionType['work_history'],
): number | null {
	let totalMonths = 0;
	let parsed = 0;

	for (const e of workHistory) {
		const startNorm = e.start_date.normalized;
		if (!startNorm) continue;

		const endDate = e.is_current
			? new Date()
			: e.end_date.normalized
				? new Date(e.end_date.normalized)
				: null;
		if (!endDate) continue;

		const startDate = new Date(startNorm);
		if (endDate >= startDate) {
			totalMonths +=
				(endDate.getFullYear() - startDate.getFullYear()) * 12 +
				(endDate.getMonth() - startDate.getMonth());
			parsed++;
		}
	}

	if (parsed === 0) return null;
	return Math.max(1, Math.round(totalMonths / 12));
}
