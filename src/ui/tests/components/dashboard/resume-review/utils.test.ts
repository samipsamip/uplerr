import { describe, expect, it } from 'vitest';

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

describe('estimateYearsOfExperience', () => {
	it('returns null when no entries have durations', () => {
		expect(
			estimateYearsOfExperience([{ role: 'Dev', company: 'A' }]),
		).toBeNull();
	});

	it('returns null for an empty array', () => {
		expect(estimateYearsOfExperience([])).toBeNull();
	});

	it('parses ISO YYYY-MM range', () => {
		const result = estimateYearsOfExperience([
			{ role: 'Dev', company: 'A', duration: '2020-01 – 2022-01' },
		]);
		expect(result).toBe(2);
	});

	it('parses "MMM yyyy" range', () => {
		const result = estimateYearsOfExperience([
			{ role: 'Dev', company: 'A', duration: 'Jan 2019 – Jan 2023' },
		]);
		expect(result).toBe(4);
	});

	it('handles Present as end date', () => {
		const now = new Date();
		const startYear = now.getFullYear() - 2;
		const result = estimateYearsOfExperience([
			{ role: 'Dev', company: 'A', duration: `Jan ${startYear} – Present` },
		]);
		expect(typeof result).toBe('number');
		expect(result).toBeGreaterThanOrEqual(2);
	});

	it('sums multiple entries', () => {
		const result = estimateYearsOfExperience([
			{ role: 'Dev', company: 'A', duration: '2018-01 – 2020-01' },
			{ role: 'Dev', company: 'B', duration: '2020-06 – 2022-06' },
		]);
		expect(result).toBe(4);
	});
});

// ---------------------------------------------------------------------------
// computeProfileStrength
// ---------------------------------------------------------------------------

describe('computeProfileStrength', () => {
	const base = {
		name: '',
		skills: [],
		experience: [],
		education: [],
		projects: [],
	};

	it('returns 0 for completely empty data', () => {
		expect(computeProfileStrength(base)).toBe(0);
	});

	it('adds points for name + location', () => {
		const score = computeProfileStrength({
			...base,
			name: 'Alice',
			location: 'AU',
		});
		expect(score).toBeGreaterThan(0);
	});

	it('caps at 100', () => {
		const score = computeProfileStrength({
			name: 'Alice',
			email: 'a@b.com',
			phone: '123',
			location: 'AU',
			links: { linkedin: 'l', github: 'g', portfolio: 'p' },
			skills: Array.from({ length: 20 }, (_, i) => `Skill${i}`),
			experience: Array.from({ length: 5 }, () => ({
				role: 'Dev',
				company: 'A',
				description: 'A'.repeat(100),
			})),
			education: [{ degree: 'BSc', institution: 'Uni' }],
			projects: [{ name: 'P' }],
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

describe('detectProfileType', () => {
	it('detects full-stack with cloud', () => {
		const result = detectProfileType([
			'Node.js',
			'Python',
			'React',
			'AWS',
			'Docker',
			'Terraform',
		]);
		expect(result).toMatch(/full-stack.*cloud/i);
	});

	it('detects frontend', () => {
		const result = detectProfileType(['React', 'Vue', 'Angular', 'TypeScript']);
		expect(result).toMatch(/frontend/i);
	});

	it('detects backend', () => {
		const result = detectProfileType([
			'Node.js',
			'Python',
			'Django',
			'Express',
		]);
		expect(result).toMatch(/backend/i);
	});

	it('falls back to software engineering for mixed/unknown', () => {
		const result = detectProfileType(['Photoshop', 'Illustrator']);
		expect(result).toMatch(/software engineering/i);
	});
});
