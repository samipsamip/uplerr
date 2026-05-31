import { describe, expect, it } from 'vitest';
import type { ResumeExtractionType, SkillExtractionType } from '@uppler/types';

import {
	categorizeSkills,
	computeProfileStrength,
	detectProfileType,
	estimateYearsOfExperience,
	strengthLabel,
} from '@/components/dashboard/resume-review/utils';

// ---------------------------------------------------------------------------
// categorizeSkills
// ---------------------------------------------------------------------------

describe('categorizeSkills', () => {
	it('groups known skills into catalog categories', () => {
		const result = categorizeSkills(['React', 'Docker', 'PostgreSQL']);
		const map = Object.fromEntries(result);
		expect(map['Frontend']).toContain('React');
		expect(map['DevOps']).toContain('Docker');
		expect(map['Data']).toContain('PostgreSQL');
	});

	it('places unknown skills in Other', () => {
		const result = categorizeSkills(['FancyNewFramework']);
		const map = Object.fromEntries(result);
		expect(map['Other']).toContain('FancyNewFramework');
	});

	it('returns empty array for empty input', () => {
		expect(categorizeSkills([])).toEqual([]);
	});

	it('respects category overrides', () => {
		const result = categorizeSkills(['React'], { React: 'Backend' });
		const map = Object.fromEntries(result);
		expect(map['Backend']).toContain('React');
		expect(map['Frontend']).toBeUndefined();
	});

	it('resolves skills via catalog aliases', () => {
		const result = categorizeSkills(['NodeJS', 'K8s', 'Tailwind']);
		const map = Object.fromEntries(result);
		expect(map['Backend']).toContain('NodeJS');
		expect(map['DevOps']).toContain('K8s');
		expect(map['Frontend']).toContain('Tailwind');
	});

	it('each skill appears exactly once', () => {
		const skills = ['React', 'Docker', 'PostgreSQL', 'SomeUnknown'];
		const result = categorizeSkills(skills);
		const all = result.flatMap(([, s]) => s);
		expect(all.length).toBe(skills.length);
		expect(new Set(all).size).toBe(skills.length);
	});
});

// ---------------------------------------------------------------------------
// estimateYearsOfExperience
// ---------------------------------------------------------------------------

const makeEntry = (
	startNorm: string | null,
	endNorm: string | null,
	isCurrent = false,
): ResumeExtractionType['work_history'][number] => ({
	company: 'A',
	role: 'Dev',
	start_date: { raw: startNorm, normalized: startNorm },
	end_date: { raw: endNorm, normalized: endNorm },
	is_current: isCurrent,
	bullet_points: [],
});

describe('estimateYearsOfExperience', () => {
	it('returns null when no entries have durations', () => {
		expect(estimateYearsOfExperience([makeEntry(null, null)])).toBeNull();
	});

	it('returns null for an empty array', () => {
		expect(estimateYearsOfExperience([])).toBeNull();
	});

	it('parses ISO YYYY-MM range', () => {
		const result = estimateYearsOfExperience([
			makeEntry('2020-01-01', '2022-01-01'),
		]);
		expect(result).toBe(2);
	});

	it('parses "MMM yyyy" range', () => {
		const result = estimateYearsOfExperience([
			makeEntry('2019-01-01', '2023-01-01'),
		]);
		expect(result).toBe(4);
	});

	it('handles Present as end date', () => {
		const startYear = new Date().getFullYear() - 2;
		const result = estimateYearsOfExperience([
			makeEntry(`${startYear}-01-01`, null, true),
		]);
		expect(typeof result).toBe('number');
		expect(result).toBeGreaterThanOrEqual(2);
	});

	it('sums multiple entries', () => {
		const result = estimateYearsOfExperience([
			makeEntry('2018-01-01', '2020-01-01'),
			makeEntry('2020-06-01', '2022-06-01'),
		]);
		expect(result).toBe(4);
	});
});

// ---------------------------------------------------------------------------
// computeProfileStrength
// ---------------------------------------------------------------------------

const emptySkills: SkillExtractionType = {
	technical_skills: [],
	tools_platforms: [],
	spoken_languages: [],
	soft_skills: [],
};

const emptyExtraction: ResumeExtractionType = {
	full_name: null,
	contact_details: {
		email: null,
		phone: null,
		location: null,
		linkedin: null,
		vcs_platform: null,
		vcs_url: null,
		portfolio: null,
	},
	professional_summary: null,
	work_history: [],
	education: [],
	certifications: [],
	notable_achievements: [],
};

describe('computeProfileStrength', () => {
	it('returns 0 for completely empty data', () => {
		expect(
			computeProfileStrength({
				extraction: emptyExtraction,
				skills: emptySkills,
				projects: { projects: [] },
			}),
		).toBe(0);
	});

	it('adds points for name + location', () => {
		const score = computeProfileStrength({
			extraction: {
				...emptyExtraction,
				full_name: 'Alice',
				contact_details: { ...emptyExtraction.contact_details, location: 'AU' },
			},
			skills: emptySkills,
			projects: { projects: [] },
		});
		expect(score).toBeGreaterThan(0);
	});

	it('caps at 100', () => {
		const bigSkills: SkillExtractionType = {
			technical_skills: Array.from({ length: 10 }, (_, i) => ({
				name: `Skill${i}`,
				source: 'skills_section' as const,
			})),
			tools_platforms: Array.from({ length: 10 }, (_, i) => ({
				name: `Tool${i}`,
				source: 'skills_section' as const,
			})),
			spoken_languages: [],
			soft_skills: [],
		};
		const score = computeProfileStrength({
			extraction: {
				full_name: 'Alice',
				contact_details: {
					email: 'a@b.com',
					phone: '123',
					location: 'AU',
					linkedin: 'l',
					vcs_platform: 'GitHub' as const,
					vcs_url: 'g',
					portfolio: 'p',
				},
				professional_summary: null,
				work_history: Array.from({ length: 5 }, () => ({
					company: 'A',
					role: 'Dev',
					start_date: { raw: '2020-01-01', normalized: '2020-01-01' },
					end_date: { raw: null, normalized: null },
					is_current: true,
					bullet_points: ['Did stuff', 'Did more stuff'],
				})),
				education: [
					{
						institution: 'Uni',
						degree: 'BSc',
						field_of_study: null,
						start_date: { raw: null, normalized: null },
						end_date: { raw: null, normalized: null },
					},
				],
				certifications: [],
				notable_achievements: [],
			},
			skills: bigSkills,
			projects: { projects: [] },
		});
		expect(score).toBeLessThanOrEqual(100);
	});
});

// ---------------------------------------------------------------------------
// strengthLabel
// ---------------------------------------------------------------------------

describe('strengthLabel', () => {
	it('returns Excellent for >= 85', () => {
		expect(strengthLabel(85)).toBe('Excellent');
		expect(strengthLabel(100)).toBe('Excellent');
	});

	it('returns Strong for 70-84', () => {
		expect(strengthLabel(70)).toBe('Strong');
		expect(strengthLabel(84)).toBe('Strong');
	});

	it('returns Good for 50-69', () => {
		expect(strengthLabel(50)).toBe('Good');
		expect(strengthLabel(69)).toBe('Good');
	});

	it('returns Building for < 50', () => {
		expect(strengthLabel(0)).toBe('Building');
		expect(strengthLabel(49)).toBe('Building');
	});
});

// ---------------------------------------------------------------------------
// detectProfileType
// ---------------------------------------------------------------------------

const makeSkills = (names: string[]): SkillExtractionType => ({
	technical_skills: names.map((n) => ({
		name: n,
		source: 'skills_section' as const,
	})),
	tools_platforms: [],
	spoken_languages: [],
	soft_skills: [],
});

describe('detectProfileType', () => {
	it('detects full-stack with cloud', () => {
		const result = detectProfileType(
			makeSkills(['Node.js', 'Python', 'React', 'AWS', 'Docker', 'Terraform']),
		);
		expect(result).toMatch(/full-stack.*cloud/i);
	});

	it('detects frontend', () => {
		const result = detectProfileType(
			makeSkills(['React', 'Vue', 'Angular', 'TypeScript']),
		);
		expect(result).toMatch(/frontend/i);
	});

	it('detects backend', () => {
		const result = detectProfileType(
			makeSkills(['Node.js', 'Python', 'Django', 'Express']),
		);
		expect(result).toMatch(/backend/i);
	});

	it('falls back to software engineering for mixed/unknown', () => {
		const result = detectProfileType(makeSkills(['Photoshop', 'Illustrator']));
		expect(result).toMatch(/software engineering/i);
	});
});
