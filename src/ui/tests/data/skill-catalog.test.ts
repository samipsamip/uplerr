import { describe, expect, it } from 'vitest';

import {
	lookupSkill,
	lookupSkillCategory,
	SKILL_CATALOG,
	SKILL_CATEGORY_ORDER,
} from '@/data/skill-catalog';

describe('SKILL_CATALOG', () => {
	it('contains at least 90 entries', () => {
		expect(SKILL_CATALOG.length).toBeGreaterThanOrEqual(90);
	});

	it('every entry has slug, displayName, category, and terms', () => {
		for (const entry of SKILL_CATALOG) {
			expect(entry.slug).toBeTruthy();
			expect(entry.displayName).toBeTruthy();
			expect(SKILL_CATEGORY_ORDER).toContain(entry.category);
			expect(entry.terms.length).toBeGreaterThan(0);
		}
	});

	it('every term is lowercase', () => {
		for (const entry of SKILL_CATALOG) {
			for (const term of entry.terms) {
				expect(term).toBe(term.toLowerCase());
			}
		}
	});
});

describe('lookupSkill', () => {
	it('finds a skill by exact slug', () => {
		const result = lookupSkill('javascript');
		expect(result?.slug).toBe('javascript');
		expect(result?.displayName).toBe('JavaScript');
		expect(result?.category).toBe('Frontend');
	});

	it('finds a skill by display name (case-insensitive)', () => {
		expect(lookupSkill('JavaScript')?.slug).toBe('javascript');
		expect(lookupSkill('TYPESCRIPT')?.slug).toBe('typescript');
	});

	it('finds a skill by alias', () => {
		expect(lookupSkill('NodeJS')?.slug).toBe('nodejs');
		expect(lookupSkill('ReactJS')?.slug).toBe('react');
		expect(lookupSkill('K8s')?.slug).toBe('kubernetes');
		expect(lookupSkill('Postgres')?.slug).toBe('postgresql');
	});

	it('is case-insensitive for aliases', () => {
		expect(lookupSkill('node.js')?.slug).toBe('nodejs');
		expect(lookupSkill('NODE.JS')?.slug).toBe('nodejs');
	});

	it('trims whitespace before lookup', () => {
		expect(lookupSkill('  react  ')?.slug).toBe('react');
	});

	it('returns null for an unrecognized skill', () => {
		expect(lookupSkill('SuperFakeSkill9999')).toBeNull();
	});

	it('returns null for an empty string', () => {
		expect(lookupSkill('')).toBeNull();
	});
});

describe('lookupSkillCategory', () => {
	it('returns the correct category for known skills', () => {
		expect(lookupSkillCategory('React')).toBe('Frontend');
		expect(lookupSkillCategory('Docker')).toBe('DevOps');
		expect(lookupSkillCategory('PostgreSQL')).toBe('Data');
		expect(lookupSkillCategory('Jest')).toBe('Testing');
		expect(lookupSkillCategory('Figma')).toBe('Design');
	});

	it('returns Other for unknown skills', () => {
		expect(lookupSkillCategory('NotARealSkill')).toBe('Other');
		expect(lookupSkillCategory('')).toBe('Other');
	});

	it('resolves via alias to correct category', () => {
		expect(lookupSkillCategory('K8s')).toBe('DevOps');
		expect(lookupSkillCategory('Tailwind')).toBe('Frontend');
	});
});

describe('SKILL_CATEGORY_ORDER', () => {
	it('includes Other as the last entry', () => {
		expect(SKILL_CATEGORY_ORDER[SKILL_CATEGORY_ORDER.length - 1]).toBe('Other');
	});

	it('contains all expected categories', () => {
		const expected = [
			'Frontend',
			'Backend',
			'Mobile',
			'DevOps',
			'Cloud',
			'Data',
			'Testing',
			'Security',
			'Design',
			'Language',
			'Soft',
			'Other',
		];
		for (const cat of expected) {
			expect(SKILL_CATEGORY_ORDER).toContain(cat);
		}
	});
});
