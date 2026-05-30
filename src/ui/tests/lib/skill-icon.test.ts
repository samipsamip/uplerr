import { describe, expect, it } from 'vitest';

import { getSkillIcon } from '@/lib/skill-icon';

describe('getSkillIcon', () => {
	it('returns an icon for well-known skills by slug', () => {
		expect(getSkillIcon('javascript')).toBe('JavaScript');
		expect(getSkillIcon('typescript')).toBe('TypeScript');
		expect(getSkillIcon('react')).toBe('React');
		expect(getSkillIcon('docker')).toBe('Docker');
		expect(getSkillIcon('git')).toBe('Git');
		expect(getSkillIcon('python')).toBe('Python');
	});

	it('resolves via catalog alias to the correct icon', () => {
		expect(getSkillIcon('Node.js')).toBe('node-js');
		expect(getSkillIcon('NodeJS')).toBe('node-js');
		expect(getSkillIcon('Next.js')).toBe('next-js');
		expect(getSkillIcon('Tailwind')).toBe('Tailwind-CSS');
		expect(getSkillIcon('Postgres')).toBe('PostgresSQL');
		expect(getSkillIcon('K8s')).toBe('Kubernetes');
	});

	it('is case-insensitive', () => {
		expect(getSkillIcon('REACT')).toBe('React');
		expect(getSkillIcon('Docker')).toBe('Docker');
	});

	it('returns null for skills without a mapped icon', () => {
		expect(getSkillIcon('SomeObscureFramework')).toBeNull();
		expect(getSkillIcon('')).toBeNull();
	});

	it('handles display name overrides', () => {
		expect(getSkillIcon('C#')).toBe('c-sharp');
		expect(getSkillIcon('.NET')).toBe('c-sharp');
		expect(getSkillIcon('Tailwind CSS')).toBe('Tailwind-CSS');
	});
});
