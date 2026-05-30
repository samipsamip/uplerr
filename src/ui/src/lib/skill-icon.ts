import type { BrandIconName } from '@/components/dashboard/brand-icon/brand-icons.types';

const SLUG_TO_ICON: Record<string, BrandIconName> = {
	javascript: 'JavaScript',
	typescript: 'TypeScript',
	react: 'React',
	nextjs: 'next-js',
	vuejs: 'vue-js',
	angular: 'Angular',
	svelte: 'Svelte',
	tailwindcss: 'Tailwind-CSS',
	html: 'HTML5',
	css: 'CSS3',
	redux: 'Redux',
	vite: 'Vite',
	webpack: 'Webpack',
	storybook: 'Storybook',
	nodejs: 'node-js',
	python: 'Python',
	java: 'Java',
	golang: 'Go',
	rust: 'Rust',
	php: 'PHP',
	ruby: 'Ruby',
	expressjs: 'Express',
	nestjs: 'nest-js',
	fastapi: 'FastAPI',
	django: 'Django',
	'spring-boot': 'Spring',
	graphql: 'GraphQL',
	csharp: 'c-sharp',
	flutter: 'Flutter',
	swift: 'Swift',
	kotlin: 'Kotlin',
	docker: 'Docker',
	kubernetes: 'Kubernetes',
	terraform: 'HashiCorp-Terraform',
	'github-actions': 'GitHub-Actions',
	jenkins: 'Jenkins',
	helm: 'Helm',
	argocd: 'Argo-CD',
	linux: 'Linux',
	ansible: 'Ansible',
	nginx: 'NGINX',
	git: 'Git',
	aws: 'AWS',
	gcp: 'Google-Cloud',
	azure: 'Azure',
	firebase: 'Firebase',
	cloudflare: 'Cloudflare',
	vercel: 'Vercel',
	postgresql: 'PostgresSQL',
	mysql: 'MySQL',
	mongodb: 'MongoDB',
	redis: 'Redis',
	elasticsearch: 'Elastic-Search',
	sqlite: 'SQLite',
	kafka: 'Apache-Kafka',
	jest: 'Jest',
	cypress: 'Cypress',
	playwright: 'Playwrite',
	pytest: 'pytest',
	selenium: 'Selenium',
	figma: 'Figma',
	'adobe-xd': 'Adobe-XD',
	'react-native': 'React',
};

const _nameToIcon = new Map<string, BrandIconName>();
for (const [slug, icon] of Object.entries(SLUG_TO_ICON)) {
	_nameToIcon.set(slug, icon);
}

const DISPLAY_NAME_OVERRIDES: Record<string, BrandIconName> = {
	javascript: 'JavaScript',
	typescript: 'TypeScript',
	'react.js': 'React',
	reactjs: 'React',
	'node.js': 'node-js',
	'next.js': 'next-js',
	'vue.js': 'vue-js',
	'tailwind css': 'Tailwind-CSS',
	tailwind: 'Tailwind-CSS',
	html5: 'HTML5',
	css3: 'CSS3',
	'express.js': 'Express',
	'nest.js': 'nest-js',
	'spring boot': 'Spring',
	'c#': 'c-sharp',
	'.net': 'c-sharp',
	'google cloud': 'Google-Cloud',
	'google cloud platform': 'Google-Cloud',
	postgres: 'PostgresSQL',
	postgresql: 'PostgresSQL',
	k8s: 'Kubernetes',
	'github actions': 'GitHub-Actions',
};

import { lookupSkill } from '@/data/skill-catalog';

export function getSkillIcon(name: string): BrandIconName | null {
	const lower = name.toLowerCase().trim();

	const override = DISPLAY_NAME_OVERRIDES[lower];
	if (override) return override;

	const entry = lookupSkill(name);
	if (entry) {
		const icon = _nameToIcon.get(entry.slug);
		if (icon) return icon;
	}

	// Last resort: check slug-style normalised name directly
	const slugified = lower.replace(/[\s.]/g, '-').replace(/[^a-z0-9-]/g, '');
	return (_nameToIcon.get(slugified) as BrandIconName | undefined) ?? null;
}
