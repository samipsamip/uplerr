import type { ResumeStructuredData } from '@uppler/types';

export type CategoryName =
	| 'Frontend'
	| 'Backend'
	| 'Cloud & Infra'
	| 'Database'
	| 'Tools';

export const CATEGORY_ORDER: CategoryName[] = [
	'Frontend',
	'Backend',
	'Cloud & Infra',
	'Database',
	'Tools',
];

export const CATEGORY_KEYWORDS: Record<CategoryName, string[]> = {
	Frontend: [
		'react',
		'vue',
		'angular',
		'svelte',
		'next.js',
		'nextjs',
		'typescript',
		'javascript',
		'html',
		'css',
		'tailwind',
		'ant design',
		'redux',
		'vite',
		'webpack',
		'sass',
	],
	Backend: [
		'node.js',
		'python',
		'java',
		'rust',
		'express',
		'fastapi',
		'django',
		'hono',
		'php',
		'ruby',
		'sequelize',
		'bookshelf',
		'.net',
		'spring',
		'rails',
	],
	'Cloud & Infra': [
		'aws',
		'gcp',
		'google cloud',
		'azure',
		'docker',
		'kubernetes',
		'terraform',
		'cloudbuild',
		'logs explorer',
		'pub/sub',
		'cloudwatch',
		'codecommit',
		'nginx',
		'linux',
		'k8s',
	],
	Database: [
		'sql',
		'postgresql',
		'postgres',
		'mysql',
		'mongodb',
		'redis',
		'firebase',
		'nosql',
		'rds',
		's3',
		'dynamodb',
		'elasticsearch',
		'cassandra',
	],
	Tools: [
		'stripe',
		'hubspot',
		'go high level',
		'git',
		'figma',
		'postman',
		'jira',
		'ngrok',
	],
};

export function skillMatchesKeyword(skill: string, keyword: string): boolean {
	const s = skill.toLowerCase();
	const k = keyword.toLowerCase();
	if (s === k) return true;
	if (k.length >= 4 && s.includes(k)) return true;
	if (s.length >= 4 && k.includes(s)) return true;
	return false;
}

export function categorizeSkills(skills: string[]): [string, string[]][] {
	const result = new Map<string, string[]>();
	const assigned = new Set<string>();

	for (const category of CATEGORY_ORDER) {
		const matches = skills.filter(
			(skill) =>
				!assigned.has(skill) &&
				CATEGORY_KEYWORDS[category].some((kw) =>
					skillMatchesKeyword(skill, kw),
				),
		);
		if (matches.length > 0) {
			result.set(category, matches);
			matches.forEach((m) => assigned.add(m));
		}
	}

	const other = skills.filter((s) => !assigned.has(s));
	if (other.length > 0) result.set('Other', other);

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
