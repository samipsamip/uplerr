import type { ResumeStructuredData } from '@uppler/types';

import {
	lookupSkillCategory,
	SKILL_CATEGORY_ORDER,
	type SkillCategory,
} from '@/data/skill-catalog';

export type { SkillCategory };
export { SKILL_CATEGORY_ORDER };

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

	// Anything not matched by catalog lands in Other
	const other = skills.filter((s) => !assigned.has(s));
	if (other.length > 0) {
		const existing = result.get('Other') ?? [];
		result.set('Other', [...existing, ...other]);
	}

	return Array.from(result.entries());
}

export function computeProfileStrength(data: ResumeStructuredData): number {
	let score = 0;
	if (data.name) score += 10;
	if (data.email) score += 10;
	if (data.phone) score += 5;
	if (data.location) score += 5;
	if (data.links?.linkedin) score += 4;
	if (data.links?.github) score += 4;
	if (data.links?.portfolio) score += 2;
	score += Math.min(data.skills.length * 1.2, 24);
	if (data.experience.length > 0) score += 15;
	if (data.experience.length > 1) score += 5;
	data.experience.forEach((e) => {
		if (e.description && e.description.length > 80) score += 3;
	});
	if (data.education.length > 0) score += 7;
	return Math.min(Math.round(score), 100);
}

export function detectProfileType(skills: string[]): string {
	const lower = skills.map((s) => s.toLowerCase());
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
	experience: ResumeStructuredData['experience'],
): number | null {
	let totalMonths = 0;
	let parsed = 0;

	for (const e of experience) {
		if (!e.duration) continue;
		// Handles "YYYY-MM - YYYY-MM", "YYYY-MM - Present", "Jan 2020 – Mar 2024" etc.
		const parts = e.duration.split(/\s+[-–—]\s+|\s+to\s+/i);
		if (parts.length < 2) continue;

		const start = parseApproxDate(parts[0].trim());
		const end = parts[1].trim().toLowerCase().includes('present')
			? new Date()
			: parseApproxDate(parts[1].trim());

		if (start && end && end >= start) {
			totalMonths +=
				(end.getFullYear() - start.getFullYear()) * 12 +
				(end.getMonth() - start.getMonth());
			parsed++;
		}
	}

	if (parsed === 0) return null;
	return Math.max(1, Math.round(totalMonths / 12));
}

function parseApproxDate(s: string): Date | null {
	// "2022-01" or "2022"
	const isoMatch = s.match(/^(\d{4})(?:-(\d{2}))?$/);
	if (isoMatch) {
		return new Date(
			parseInt(isoMatch[1]),
			isoMatch[2] ? parseInt(isoMatch[2]) - 1 : 0,
		);
	}
	// "Jan 2022" / "January 2022"
	const monthYear = s.match(
		/^(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*\s+(\d{4})$/i,
	);
	if (monthYear) {
		const monthMap: Record<string, number> = {
			jan: 0,
			feb: 1,
			mar: 2,
			apr: 3,
			may: 4,
			jun: 5,
			jul: 6,
			aug: 7,
			sep: 8,
			oct: 9,
			nov: 10,
			dec: 11,
		};
		const m = monthMap[monthYear[1].slice(0, 3).toLowerCase()];
		return new Date(parseInt(monthYear[2]), m ?? 0);
	}
	return null;
}
