export type SkillCategory =
	| 'Frontend'
	| 'Backend'
	| 'Mobile'
	| 'DevOps'
	| 'Cloud'
	| 'Data'
	| 'Testing'
	| 'Security'
	| 'Design'
	| 'Language'
	| 'Soft'
	| 'Other';

export const SKILL_CATEGORY_ORDER: SkillCategory[] = [
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

interface CatalogEntry {
	slug: string;
	displayName: string;
	category: SkillCategory;
	terms: string[]; // all lowercase lookup keys: slug, display name, aliases
}

const RAW: Array<{
	slug: string;
	displayName: string;
	category: SkillCategory;
	aliases: string[];
}> = [
	// Frontend
	{
		slug: 'javascript',
		displayName: 'JavaScript',
		category: 'Frontend',
		aliases: ['js', 'java script', 'ecmascript', 'es6', 'es2015'],
	},
	{
		slug: 'typescript',
		displayName: 'TypeScript',
		category: 'Frontend',
		aliases: ['ts'],
	},
	{
		slug: 'react',
		displayName: 'React',
		category: 'Frontend',
		aliases: ['reactjs', 'react.js', 'react js'],
	},
	{
		slug: 'nextjs',
		displayName: 'Next.js',
		category: 'Frontend',
		aliases: ['next.js', 'nextjs', 'next js'],
	},
	{
		slug: 'vuejs',
		displayName: 'Vue.js',
		category: 'Frontend',
		aliases: ['vue', 'vue.js', 'vuejs', 'vue js'],
	},
	{
		slug: 'angular',
		displayName: 'Angular',
		category: 'Frontend',
		aliases: ['angularjs', 'angular.js'],
	},
	{
		slug: 'svelte',
		displayName: 'Svelte',
		category: 'Frontend',
		aliases: ['sveltekit', 'svelte kit'],
	},
	{
		slug: 'tailwindcss',
		displayName: 'Tailwind CSS',
		category: 'Frontend',
		aliases: ['tailwind', 'tailwind css'],
	},
	{
		slug: 'html',
		displayName: 'HTML',
		category: 'Frontend',
		aliases: ['html5', 'hyper text markup language'],
	},
	{
		slug: 'css',
		displayName: 'CSS',
		category: 'Frontend',
		aliases: ['css3', 'cascading style sheets'],
	},
	{
		slug: 'redux',
		displayName: 'Redux',
		category: 'Frontend',
		aliases: ['redux toolkit', 'rtk'],
	},
	{ slug: 'vite', displayName: 'Vite', category: 'Frontend', aliases: [] },
	{
		slug: 'webpack',
		displayName: 'Webpack',
		category: 'Frontend',
		aliases: [],
	},
	{
		slug: 'storybook',
		displayName: 'Storybook',
		category: 'Frontend',
		aliases: ['storybook.js'],
	},
	// Backend
	{
		slug: 'nodejs',
		displayName: 'Node.js',
		category: 'Backend',
		aliases: ['node.js', 'nodejs', 'node', 'node js'],
	},
	{
		slug: 'python',
		displayName: 'Python',
		category: 'Backend',
		aliases: ['python3', 'python 3'],
	},
	{
		slug: 'java',
		displayName: 'Java',
		category: 'Backend',
		aliases: ['java se', 'java ee', 'jvm'],
	},
	{
		slug: 'golang',
		displayName: 'Go',
		category: 'Backend',
		aliases: ['go', 'go lang', 'golang'],
	},
	{
		slug: 'rust',
		displayName: 'Rust',
		category: 'Backend',
		aliases: ['rust lang'],
	},
	{ slug: 'php', displayName: 'PHP', category: 'Backend', aliases: [] },
	{ slug: 'ruby', displayName: 'Ruby', category: 'Backend', aliases: [] },
	{
		slug: 'expressjs',
		displayName: 'Express.js',
		category: 'Backend',
		aliases: ['express', 'express.js', 'expressjs'],
	},
	{
		slug: 'nestjs',
		displayName: 'NestJS',
		category: 'Backend',
		aliases: ['nest.js', 'nest js', 'nest'],
	},
	{
		slug: 'fastapi',
		displayName: 'FastAPI',
		category: 'Backend',
		aliases: ['fast api', 'fast-api'],
	},
	{
		slug: 'django',
		displayName: 'Django',
		category: 'Backend',
		aliases: ['django rest framework', 'drf'],
	},
	{
		slug: 'spring-boot',
		displayName: 'Spring Boot',
		category: 'Backend',
		aliases: ['spring', 'springboot', 'spring framework', 'spring mvc'],
	},
	{
		slug: 'hono',
		displayName: 'Hono',
		category: 'Backend',
		aliases: ['hono.js'],
	},
	{
		slug: 'graphql',
		displayName: 'GraphQL',
		category: 'Backend',
		aliases: ['gql', 'graph ql', 'graphql api'],
	},
	{
		slug: 'rest-api',
		displayName: 'REST API',
		category: 'Backend',
		aliases: ['rest', 'restful', 'restful api', 'rest apis', 'http api'],
	},
	{
		slug: 'csharp',
		displayName: 'C#',
		category: 'Backend',
		aliases: ['c#', 'csharp', 'c sharp'],
	},
	{
		slug: 'dotnet',
		displayName: '.NET',
		category: 'Backend',
		aliases: ['.net', 'dotnet', 'asp.net', 'asp.net core'],
	},
	// Mobile
	{
		slug: 'react-native',
		displayName: 'React Native',
		category: 'Mobile',
		aliases: ['reactnative', 'rn', 'react-native'],
	},
	{
		slug: 'flutter',
		displayName: 'Flutter',
		category: 'Mobile',
		aliases: ['flutter sdk'],
	},
	{
		slug: 'swift',
		displayName: 'Swift',
		category: 'Mobile',
		aliases: ['swift ios'],
	},
	{
		slug: 'kotlin',
		displayName: 'Kotlin',
		category: 'Mobile',
		aliases: ['kotlin android'],
	},
	{
		slug: 'expo',
		displayName: 'Expo',
		category: 'Mobile',
		aliases: ['expo sdk'],
	},
	// DevOps
	{
		slug: 'docker',
		displayName: 'Docker',
		category: 'DevOps',
		aliases: ['docker container', 'docker compose', 'dockerfile'],
	},
	{
		slug: 'kubernetes',
		displayName: 'Kubernetes',
		category: 'DevOps',
		aliases: ['k8s', 'kube'],
	},
	{
		slug: 'terraform',
		displayName: 'Terraform',
		category: 'DevOps',
		aliases: ['tf', 'hashicorp terraform'],
	},
	{
		slug: 'github-actions',
		displayName: 'GitHub Actions',
		category: 'DevOps',
		aliases: ['gh actions', 'github actions ci'],
	},
	{
		slug: 'jenkins',
		displayName: 'Jenkins',
		category: 'DevOps',
		aliases: ['jenkins ci', 'jenkins ci/cd'],
	},
	{
		slug: 'helm',
		displayName: 'Helm',
		category: 'DevOps',
		aliases: ['helm charts', 'helm chart'],
	},
	{
		slug: 'argocd',
		displayName: 'ArgoCD',
		category: 'DevOps',
		aliases: ['argo cd', 'argo'],
	},
	{
		slug: 'linux',
		displayName: 'Linux',
		category: 'DevOps',
		aliases: ['linux os', 'unix', 'ubuntu', 'debian', 'centos', 'bash'],
	},
	{
		slug: 'ansible',
		displayName: 'Ansible',
		category: 'DevOps',
		aliases: ['ansible playbook'],
	},
	{
		slug: 'nginx',
		displayName: 'Nginx',
		category: 'DevOps',
		aliases: ['nginx web server'],
	},
	{
		slug: 'git',
		displayName: 'Git',
		category: 'DevOps',
		aliases: ['version control', 'git vcs'],
	},
	// Cloud
	{
		slug: 'aws',
		displayName: 'AWS',
		category: 'Cloud',
		aliases: ['amazon web services', 'amazon aws', 'aws cloud'],
	},
	{
		slug: 'gcp',
		displayName: 'Google Cloud',
		category: 'Cloud',
		aliases: ['google cloud', 'google cloud platform', 'google gcp'],
	},
	{
		slug: 'azure',
		displayName: 'Azure',
		category: 'Cloud',
		aliases: ['microsoft azure', 'azure cloud'],
	},
	{
		slug: 'firebase',
		displayName: 'Firebase',
		category: 'Cloud',
		aliases: ['google firebase', 'firebase realtime', 'firestore'],
	},
	{
		slug: 'cloudflare',
		displayName: 'Cloudflare',
		category: 'Cloud',
		aliases: [],
	},
	{ slug: 'vercel', displayName: 'Vercel', category: 'Cloud', aliases: [] },
	{ slug: 'netlify', displayName: 'Netlify', category: 'Cloud', aliases: [] },
	{ slug: 'supabase', displayName: 'Supabase', category: 'Cloud', aliases: [] },
	{
		slug: 'aws-lambda',
		displayName: 'AWS Lambda',
		category: 'Cloud',
		aliases: ['lambda', 'serverless functions', 'serverless'],
	},
	{
		slug: 'cloud-run',
		displayName: 'Google Cloud Run',
		category: 'Cloud',
		aliases: ['cloud run', 'gcp cloud run'],
	},
	// Data
	{
		slug: 'sql',
		displayName: 'SQL',
		category: 'Data',
		aliases: ['structured query language', 'sql queries', 'rdbms'],
	},
	{
		slug: 'postgresql',
		displayName: 'PostgreSQL',
		category: 'Data',
		aliases: ['postgres', 'psql', 'pg', 'postgresql'],
	},
	{
		slug: 'mysql',
		displayName: 'MySQL',
		category: 'Data',
		aliases: ['my sql', 'mysql db'],
	},
	{
		slug: 'mongodb',
		displayName: 'MongoDB',
		category: 'Data',
		aliases: ['mongo', 'mongodb atlas', 'mongoose'],
	},
	{
		slug: 'redis',
		displayName: 'Redis',
		category: 'Data',
		aliases: ['redis cache', 'redis db'],
	},
	{
		slug: 'elasticsearch',
		displayName: 'Elasticsearch',
		category: 'Data',
		aliases: ['elastic', 'elk', 'opensearch'],
	},
	{
		slug: 'prisma',
		displayName: 'Prisma',
		category: 'Data',
		aliases: ['prisma orm', 'prisma client'],
	},
	{
		slug: 'drizzle-orm',
		displayName: 'Drizzle ORM',
		category: 'Data',
		aliases: ['drizzle', 'drizzle orm'],
	},
	{
		slug: 'kafka',
		displayName: 'Apache Kafka',
		category: 'Data',
		aliases: ['apache kafka', 'kafka streams', 'confluent kafka'],
	},
	{
		slug: 'clickhouse',
		displayName: 'ClickHouse',
		category: 'Data',
		aliases: [],
	},
	{
		slug: 'sqlite',
		displayName: 'SQLite',
		category: 'Data',
		aliases: ['sqlite3', 'sqlite db'],
	},
	// Testing
	{
		slug: 'jest',
		displayName: 'Jest',
		category: 'Testing',
		aliases: ['jest testing', 'jest js'],
	},
	{
		slug: 'vitest',
		displayName: 'Vitest',
		category: 'Testing',
		aliases: ['vite test'],
	},
	{
		slug: 'cypress',
		displayName: 'Cypress',
		category: 'Testing',
		aliases: ['cypress e2e', 'cypress.io'],
	},
	{
		slug: 'playwright',
		displayName: 'Playwright',
		category: 'Testing',
		aliases: ['playwright e2e', 'playwright testing'],
	},
	{
		slug: 'react-testing-library',
		displayName: 'React Testing Library',
		category: 'Testing',
		aliases: ['rtl', 'testing library', '@testing-library/react'],
	},
	{
		slug: 'pytest',
		displayName: 'pytest',
		category: 'Testing',
		aliases: ['py.test', 'python testing'],
	},
	{
		slug: 'selenium',
		displayName: 'Selenium',
		category: 'Testing',
		aliases: ['selenium webdriver', 'selenium grid'],
	},
	{ slug: 'k6', displayName: 'k6', category: 'Testing', aliases: [] },
	// Security
	{
		slug: 'oauth',
		displayName: 'OAuth 2.0',
		category: 'Security',
		aliases: ['oauth', 'oauth2', 'oauth 2.0', 'open authorization'],
	},
	{
		slug: 'jwt',
		displayName: 'JWT',
		category: 'Security',
		aliases: ['json web token', 'jwt token'],
	},
	{
		slug: 'tls-ssl',
		displayName: 'TLS/SSL',
		category: 'Security',
		aliases: ['tls', 'ssl', 'https'],
	},
	{ slug: 'owasp', displayName: 'OWASP', category: 'Security', aliases: [] },
	// Design
	{
		slug: 'figma',
		displayName: 'Figma',
		category: 'Design',
		aliases: ['figma design'],
	},
	{
		slug: 'ux-design',
		displayName: 'UX Design',
		category: 'Design',
		aliases: ['ux', 'ui/ux', 'ui ux', 'user experience'],
	},
	{
		slug: 'adobe-xd',
		displayName: 'Adobe XD',
		category: 'Design',
		aliases: ['xd', 'adobe xd'],
	},
	// Language
	{
		slug: 'english',
		displayName: 'English',
		category: 'Language',
		aliases: ['english language', 'business english'],
	},
	{
		slug: 'mandarin',
		displayName: 'Mandarin',
		category: 'Language',
		aliases: ['chinese', 'mandarin chinese'],
	},
	{
		slug: 'spanish',
		displayName: 'Spanish',
		category: 'Language',
		aliases: ['spanish language'],
	},
	{
		slug: 'nepali',
		displayName: 'Nepali',
		category: 'Language',
		aliases: ['nepalese', 'nepali language'],
	},
	{
		slug: 'hindi',
		displayName: 'Hindi',
		category: 'Language',
		aliases: ['hindi language'],
	},
	{
		slug: 'japanese',
		displayName: 'Japanese',
		category: 'Language',
		aliases: ['japanese language'],
	},
	{
		slug: 'french',
		displayName: 'French',
		category: 'Language',
		aliases: ['french language'],
	},
	{
		slug: 'arabic',
		displayName: 'Arabic',
		category: 'Language',
		aliases: ['arabic language'],
	},
	// Soft skills
	{
		slug: 'communication',
		displayName: 'Communication',
		category: 'Soft',
		aliases: [],
	},
	{
		slug: 'leadership',
		displayName: 'Leadership',
		category: 'Soft',
		aliases: [
			'team leadership',
			'technical leadership',
			'tech lead',
			'engineering leadership',
		],
	},
	{
		slug: 'problem-solving',
		displayName: 'Problem Solving',
		category: 'Soft',
		aliases: ['problem-solving', 'analytical thinking', 'analytical skills'],
	},
	{
		slug: 'agile',
		displayName: 'Agile / Scrum',
		category: 'Soft',
		aliases: [
			'scrum',
			'kanban',
			'agile methodology',
			'agile/scrum',
			'agile scrum',
		],
	},
	{
		slug: 'project-management',
		displayName: 'Project Management',
		category: 'Soft',
		aliases: ['pm', 'technical project management'],
	},
	{
		slug: 'mentoring',
		displayName: 'Mentoring',
		category: 'Soft',
		aliases: [],
	},
	{
		slug: 'critical-thinking',
		displayName: 'Critical Thinking',
		category: 'Soft',
		aliases: [],
	},
];

export const SKILL_CATALOG: CatalogEntry[] = RAW.map((r) => ({
	slug: r.slug,
	displayName: r.displayName,
	category: r.category,
	terms: [
		r.slug.toLowerCase(),
		r.displayName.toLowerCase(),
		...r.aliases.map((a) => a.toLowerCase()),
	],
}));

const _lookupMap = new Map<string, CatalogEntry>();
for (const entry of SKILL_CATALOG) {
	for (const term of entry.terms) {
		if (!_lookupMap.has(term)) _lookupMap.set(term, entry);
	}
}

export function lookupSkill(name: string): CatalogEntry | null {
	return _lookupMap.get(name.toLowerCase().trim()) ?? null;
}

export function lookupSkillCategory(name: string): SkillCategory {
	return lookupSkill(name)?.category ?? 'Other';
}
