/* eslint-disable no-console */
import { skillAliasSchema } from '../schemas/skill_aliases.schema';
import { skillsSchema } from '../schemas/skills.schema';
import db from '../utils/db';

// ---------------------------------------------------------------------------
// Skills — 100 canonical entries
// ---------------------------------------------------------------------------

const SKILLS = [
	// Frontend
	{
		slug: 'javascript',
		display_name: 'JavaScript',
		category: 'Frontend',
		difficulty: 2,
	},
	{
		slug: 'typescript',
		display_name: 'TypeScript',
		category: 'Frontend',
		difficulty: 3,
	},
	{ slug: 'react', display_name: 'React', category: 'Frontend', difficulty: 2 },
	{
		slug: 'nextjs',
		display_name: 'Next.js',
		category: 'Frontend',
		difficulty: 3,
	},
	{
		slug: 'vuejs',
		display_name: 'Vue.js',
		category: 'Frontend',
		difficulty: 2,
	},
	{
		slug: 'angular',
		display_name: 'Angular',
		category: 'Frontend',
		difficulty: 4,
	},
	{
		slug: 'svelte',
		display_name: 'Svelte',
		category: 'Frontend',
		difficulty: 2,
	},
	{
		slug: 'tailwindcss',
		display_name: 'Tailwind CSS',
		category: 'Frontend',
		difficulty: 1,
	},
	{ slug: 'html', display_name: 'HTML', category: 'Frontend', difficulty: 1 },
	{ slug: 'css', display_name: 'CSS', category: 'Frontend', difficulty: 2 },
	{ slug: 'redux', display_name: 'Redux', category: 'Frontend', difficulty: 3 },
	{ slug: 'vite', display_name: 'Vite', category: 'Frontend', difficulty: 2 },
	{
		slug: 'webpack',
		display_name: 'Webpack',
		category: 'Frontend',
		difficulty: 3,
	},
	{
		slug: 'storybook',
		display_name: 'Storybook',
		category: 'Frontend',
		difficulty: 2,
	},

	// Backend
	{
		slug: 'nodejs',
		display_name: 'Node.js',
		category: 'Backend',
		difficulty: 2,
	},
	{
		slug: 'python',
		display_name: 'Python',
		category: 'Backend',
		difficulty: 2,
	},
	{ slug: 'java', display_name: 'Java', category: 'Backend', difficulty: 3 },
	{ slug: 'golang', display_name: 'Go', category: 'Backend', difficulty: 3 },
	{ slug: 'rust', display_name: 'Rust', category: 'Backend', difficulty: 5 },
	{ slug: 'php', display_name: 'PHP', category: 'Backend', difficulty: 2 },
	{ slug: 'ruby', display_name: 'Ruby', category: 'Backend', difficulty: 2 },
	{
		slug: 'expressjs',
		display_name: 'Express.js',
		category: 'Backend',
		difficulty: 2,
	},
	{
		slug: 'nestjs',
		display_name: 'NestJS',
		category: 'Backend',
		difficulty: 3,
	},
	{
		slug: 'fastapi',
		display_name: 'FastAPI',
		category: 'Backend',
		difficulty: 2,
	},
	{
		slug: 'django',
		display_name: 'Django',
		category: 'Backend',
		difficulty: 3,
	},
	{
		slug: 'spring-boot',
		display_name: 'Spring Boot',
		category: 'Backend',
		difficulty: 4,
	},
	{ slug: 'hono', display_name: 'Hono', category: 'Backend', difficulty: 2 },
	{
		slug: 'graphql',
		display_name: 'GraphQL',
		category: 'Backend',
		difficulty: 3,
	},
	{
		slug: 'rest-api',
		display_name: 'REST API',
		category: 'Backend',
		difficulty: 2,
	},
	{ slug: 'csharp', display_name: 'C#', category: 'Backend', difficulty: 3 },
	{ slug: 'dotnet', display_name: '.NET', category: 'Backend', difficulty: 3 },

	// Mobile
	{
		slug: 'react-native',
		display_name: 'React Native',
		category: 'Mobile',
		difficulty: 3,
	},
	{
		slug: 'flutter',
		display_name: 'Flutter',
		category: 'Mobile',
		difficulty: 3,
	},
	{ slug: 'swift', display_name: 'Swift', category: 'Mobile', difficulty: 4 },
	{ slug: 'kotlin', display_name: 'Kotlin', category: 'Mobile', difficulty: 3 },
	{ slug: 'expo', display_name: 'Expo', category: 'Mobile', difficulty: 2 },

	// DevOps
	{ slug: 'docker', display_name: 'Docker', category: 'DevOps', difficulty: 3 },
	{
		slug: 'kubernetes',
		display_name: 'Kubernetes',
		category: 'DevOps',
		difficulty: 4,
	},
	{
		slug: 'terraform',
		display_name: 'Terraform',
		category: 'DevOps',
		difficulty: 4,
	},
	{
		slug: 'github-actions',
		display_name: 'GitHub Actions',
		category: 'DevOps',
		difficulty: 2,
	},
	{
		slug: 'jenkins',
		display_name: 'Jenkins',
		category: 'DevOps',
		difficulty: 3,
	},
	{ slug: 'helm', display_name: 'Helm', category: 'DevOps', difficulty: 4 },
	{ slug: 'argocd', display_name: 'ArgoCD', category: 'DevOps', difficulty: 4 },
	{ slug: 'linux', display_name: 'Linux', category: 'DevOps', difficulty: 2 },
	{
		slug: 'ansible',
		display_name: 'Ansible',
		category: 'DevOps',
		difficulty: 3,
	},
	{ slug: 'nginx', display_name: 'Nginx', category: 'DevOps', difficulty: 3 },
	{ slug: 'git', display_name: 'Git', category: 'DevOps', difficulty: 2 },

	// Cloud
	{ slug: 'aws', display_name: 'AWS', category: 'Cloud', difficulty: 3 },
	{
		slug: 'gcp',
		display_name: 'Google Cloud Platform',
		category: 'Cloud',
		difficulty: 3,
	},
	{ slug: 'azure', display_name: 'Azure', category: 'Cloud', difficulty: 3 },
	{
		slug: 'firebase',
		display_name: 'Firebase',
		category: 'Cloud',
		difficulty: 2,
	},
	{
		slug: 'cloudflare',
		display_name: 'Cloudflare',
		category: 'Cloud',
		difficulty: 2,
	},
	{ slug: 'vercel', display_name: 'Vercel', category: 'Cloud', difficulty: 1 },
	{
		slug: 'netlify',
		display_name: 'Netlify',
		category: 'Cloud',
		difficulty: 1,
	},
	{
		slug: 'supabase',
		display_name: 'Supabase',
		category: 'Cloud',
		difficulty: 2,
	},
	{
		slug: 'aws-lambda',
		display_name: 'AWS Lambda',
		category: 'Cloud',
		difficulty: 3,
	},
	{
		slug: 'cloud-run',
		display_name: 'Google Cloud Run',
		category: 'Cloud',
		difficulty: 3,
	},

	// Data
	{ slug: 'sql', display_name: 'SQL', category: 'Data', difficulty: 2 },
	{
		slug: 'postgresql',
		display_name: 'PostgreSQL',
		category: 'Data',
		difficulty: 3,
	},
	{ slug: 'mysql', display_name: 'MySQL', category: 'Data', difficulty: 2 },
	{ slug: 'mongodb', display_name: 'MongoDB', category: 'Data', difficulty: 2 },
	{ slug: 'redis', display_name: 'Redis', category: 'Data', difficulty: 3 },
	{
		slug: 'elasticsearch',
		display_name: 'Elasticsearch',
		category: 'Data',
		difficulty: 4,
	},
	{ slug: 'prisma', display_name: 'Prisma', category: 'Data', difficulty: 2 },
	{
		slug: 'drizzle-orm',
		display_name: 'Drizzle ORM',
		category: 'Data',
		difficulty: 2,
	},
	{
		slug: 'kafka',
		display_name: 'Apache Kafka',
		category: 'Data',
		difficulty: 4,
	},
	{
		slug: 'clickhouse',
		display_name: 'ClickHouse',
		category: 'Data',
		difficulty: 4,
	},
	{ slug: 'sqlite', display_name: 'SQLite', category: 'Data', difficulty: 1 },

	// Testing
	{ slug: 'jest', display_name: 'Jest', category: 'Testing', difficulty: 2 },
	{
		slug: 'vitest',
		display_name: 'Vitest',
		category: 'Testing',
		difficulty: 2,
	},
	{
		slug: 'cypress',
		display_name: 'Cypress',
		category: 'Testing',
		difficulty: 2,
	},
	{
		slug: 'playwright',
		display_name: 'Playwright',
		category: 'Testing',
		difficulty: 3,
	},
	{
		slug: 'react-testing-library',
		display_name: 'React Testing Library',
		category: 'Testing',
		difficulty: 2,
	},
	{
		slug: 'pytest',
		display_name: 'pytest',
		category: 'Testing',
		difficulty: 2,
	},
	{
		slug: 'selenium',
		display_name: 'Selenium',
		category: 'Testing',
		difficulty: 3,
	},
	{ slug: 'k6', display_name: 'k6', category: 'Testing', difficulty: 3 },

	// Security
	{
		slug: 'oauth',
		display_name: 'OAuth 2.0',
		category: 'Security',
		difficulty: 3,
	},
	{ slug: 'jwt', display_name: 'JWT', category: 'Security', difficulty: 2 },
	{
		slug: 'tls-ssl',
		display_name: 'TLS/SSL',
		category: 'Security',
		difficulty: 3,
	},
	{ slug: 'owasp', display_name: 'OWASP', category: 'Security', difficulty: 3 },

	// Design
	{ slug: 'figma', display_name: 'Figma', category: 'Design', difficulty: 2 },
	{
		slug: 'ux-design',
		display_name: 'UX Design',
		category: 'Design',
		difficulty: 3,
	},
	{
		slug: 'adobe-xd',
		display_name: 'Adobe XD',
		category: 'Design',
		difficulty: 2,
	},

	// Language (spoken/written)
	{
		slug: 'english',
		display_name: 'English',
		category: 'Language',
		difficulty: 1,
	},
	{
		slug: 'mandarin',
		display_name: 'Mandarin',
		category: 'Language',
		difficulty: 5,
	},
	{
		slug: 'spanish',
		display_name: 'Spanish',
		category: 'Language',
		difficulty: 3,
	},
	{
		slug: 'nepali',
		display_name: 'Nepali',
		category: 'Language',
		difficulty: 3,
	},
	{ slug: 'hindi', display_name: 'Hindi', category: 'Language', difficulty: 3 },
	{
		slug: 'japanese',
		display_name: 'Japanese',
		category: 'Language',
		difficulty: 5,
	},
	{
		slug: 'french',
		display_name: 'French',
		category: 'Language',
		difficulty: 3,
	},
	{
		slug: 'arabic',
		display_name: 'Arabic',
		category: 'Language',
		difficulty: 4,
	},

	// Soft skills
	{
		slug: 'communication',
		display_name: 'Communication',
		category: 'Soft',
		difficulty: 2,
	},
	{
		slug: 'leadership',
		display_name: 'Leadership',
		category: 'Soft',
		difficulty: 3,
	},
	{
		slug: 'problem-solving',
		display_name: 'Problem Solving',
		category: 'Soft',
		difficulty: 2,
	},
	{
		slug: 'agile',
		display_name: 'Agile / Scrum',
		category: 'Soft',
		difficulty: 2,
	},
	{
		slug: 'project-management',
		display_name: 'Project Management',
		category: 'Soft',
		difficulty: 3,
	},
	{
		slug: 'mentoring',
		display_name: 'Mentoring',
		category: 'Soft',
		difficulty: 3,
	},
	{
		slug: 'critical-thinking',
		display_name: 'Critical Thinking',
		category: 'Soft',
		difficulty: 2,
	},
] as const;

// ---------------------------------------------------------------------------
// Aliases
// ---------------------------------------------------------------------------

const ALIASES: Array<{ skillSlug: string; aliases: string[] }> = [
	{
		skillSlug: 'javascript',
		aliases: ['JS', 'js', 'Java Script', 'ECMAScript', 'ES6', 'ES2015'],
	},
	{ skillSlug: 'typescript', aliases: ['TS', 'ts', 'TypeScript'] },
	{
		skillSlug: 'react',
		aliases: ['ReactJS', 'React.js', 'React JS', 'reactjs'],
	},
	{ skillSlug: 'nextjs', aliases: ['Next.js', 'NextJS', 'Next JS', 'next.js'] },
	{ skillSlug: 'vuejs', aliases: ['Vue', 'Vue.js', 'VueJS', 'Vue JS', 'vue'] },
	{ skillSlug: 'angular', aliases: ['AngularJS', 'Angular.js', 'angular'] },
	{ skillSlug: 'svelte', aliases: ['SvelteKit', 'Svelte Kit'] },
	{
		skillSlug: 'tailwindcss',
		aliases: ['Tailwind', 'tailwind', 'Tailwind CSS', 'tailwind css'],
	},
	{
		skillSlug: 'html',
		aliases: ['HTML5', 'html5', 'Hyper Text Markup Language'],
	},
	{ skillSlug: 'css', aliases: ['CSS3', 'css3', 'Cascading Style Sheets'] },
	{ skillSlug: 'redux', aliases: ['Redux Toolkit', 'RTK', 'redux'] },
	{
		skillSlug: 'nodejs',
		aliases: ['Node.js', 'NodeJS', 'node', 'Node', 'Node JS', 'node.js'],
	},
	{
		skillSlug: 'python',
		aliases: ['Python3', 'python3', 'Python 3', 'python'],
	},
	{ skillSlug: 'java', aliases: ['Java SE', 'Java EE', 'JVM'] },
	{ skillSlug: 'golang', aliases: ['Go', 'Go Lang', 'GoLang', 'Golang', 'go'] },
	{ skillSlug: 'rust', aliases: ['Rust Lang', 'rust'] },
	{
		skillSlug: 'expressjs',
		aliases: ['Express', 'Express.js', 'ExpressJS', 'express'],
	},
	{ skillSlug: 'nestjs', aliases: ['Nest.js', 'Nest JS', 'Nest', 'nest'] },
	{ skillSlug: 'fastapi', aliases: ['Fast API', 'fast-api'] },
	{ skillSlug: 'django', aliases: ['django', 'Django REST Framework', 'DRF'] },
	{
		skillSlug: 'spring-boot',
		aliases: ['Spring', 'SpringBoot', 'Spring Framework', 'Spring MVC'],
	},
	{ skillSlug: 'hono', aliases: ['hono', 'Hono.js'] },
	{ skillSlug: 'graphql', aliases: ['GQL', 'gql', 'Graph QL', 'GraphQL API'] },
	{
		skillSlug: 'rest-api',
		aliases: ['REST', 'RESTful', 'RESTful API', 'REST APIs', 'HTTP API'],
	},
	{
		skillSlug: 'csharp',
		aliases: ['C#', 'c#', 'CSharp', 'C Sharp', 'c sharp'],
	},
	{
		skillSlug: 'dotnet',
		aliases: ['.NET', '.net', 'dotnet', 'ASP.NET', 'ASP.NET Core'],
	},
	{ skillSlug: 'react-native', aliases: ['ReactNative', 'RN', 'React-Native'] },
	{ skillSlug: 'flutter', aliases: ['flutter', 'Flutter SDK'] },
	{ skillSlug: 'swift', aliases: ['swift', 'Swift iOS'] },
	{ skillSlug: 'kotlin', aliases: ['kotlin', 'Kotlin Android'] },
	{ skillSlug: 'expo', aliases: ['Expo SDK', 'expo'] },
	{
		skillSlug: 'docker',
		aliases: ['docker', 'Docker Container', 'Docker Compose', 'Dockerfile'],
	},
	{
		skillSlug: 'kubernetes',
		aliases: ['K8s', 'k8s', 'k8S', 'K8S', 'kube', 'Kube'],
	},
	{
		skillSlug: 'terraform',
		aliases: ['TF', 'terraform', 'HashiCorp Terraform'],
	},
	{
		skillSlug: 'github-actions',
		aliases: [
			'GitHub Actions',
			'GH Actions',
			'github actions',
			'Github Actions CI',
		],
	},
	{ skillSlug: 'jenkins', aliases: ['jenkins', 'Jenkins CI', 'Jenkins CI/CD'] },
	{ skillSlug: 'helm', aliases: ['helm', 'Helm Charts', 'Helm Chart'] },
	{ skillSlug: 'argocd', aliases: ['Argo CD', 'Argo', 'argo cd', 'argocd'] },
	{
		skillSlug: 'linux',
		aliases: [
			'Linux OS',
			'Unix',
			'ubuntu',
			'Ubuntu',
			'Debian',
			'CentOS',
			'bash',
			'Bash',
		],
	},
	{ skillSlug: 'ansible', aliases: ['ansible', 'Ansible Playbook'] },
	{ skillSlug: 'nginx', aliases: ['nginx', 'NGINX', 'Nginx Web Server'] },
	{ skillSlug: 'git', aliases: ['git', 'Version Control', 'Git VCS'] },
	{
		skillSlug: 'aws',
		aliases: ['Amazon Web Services', 'Amazon AWS', 'AWS Cloud'],
	},
	{
		skillSlug: 'gcp',
		aliases: ['Google Cloud', 'GCP', 'Google Cloud Platform', 'Google GCP'],
	},
	{ skillSlug: 'azure', aliases: ['Microsoft Azure', 'azure', 'Azure Cloud'] },
	{
		skillSlug: 'firebase',
		aliases: ['firebase', 'Google Firebase', 'Firebase Realtime', 'Firestore'],
	},
	{ skillSlug: 'supabase', aliases: ['supabase'] },
	{
		skillSlug: 'aws-lambda',
		aliases: [
			'Lambda',
			'AWS Lambda Function',
			'Serverless Functions',
			'Serverless',
		],
	},
	{
		skillSlug: 'cloud-run',
		aliases: ['Cloud Run', 'GCP Cloud Run', 'Google Cloud Run'],
	},
	{
		skillSlug: 'sql',
		aliases: ['Structured Query Language', 'SQL Queries', 'RDBMS'],
	},
	{
		skillSlug: 'postgresql',
		aliases: ['Postgres', 'postgres', 'PSQL', 'psql', 'pg', 'Postgresql'],
	},
	{ skillSlug: 'mysql', aliases: ['My SQL', 'mysql', 'MySQL DB'] },
	{
		skillSlug: 'mongodb',
		aliases: ['Mongo', 'mongo', 'MongoDB Atlas', 'Mongoose'],
	},
	{ skillSlug: 'redis', aliases: ['redis', 'Redis Cache', 'Redis DB'] },
	{
		skillSlug: 'elasticsearch',
		aliases: ['Elastic', 'ELK', 'Opensearch', 'ElasticSearch'],
	},
	{ skillSlug: 'prisma', aliases: ['Prisma ORM', 'prisma', 'Prisma Client'] },
	{ skillSlug: 'drizzle-orm', aliases: ['Drizzle', 'drizzle', 'Drizzle ORM'] },
	{
		skillSlug: 'kafka',
		aliases: ['kafka', 'Apache Kafka', 'Kafka Streams', 'Confluent Kafka'],
	},
	{ skillSlug: 'jest', aliases: ['jest', 'Jest testing', 'Jest JS'] },
	{ skillSlug: 'vitest', aliases: ['vitest', 'Vite test'] },
	{ skillSlug: 'cypress', aliases: ['cypress', 'Cypress E2E', 'Cypress.io'] },
	{
		skillSlug: 'playwright',
		aliases: ['playwright', 'Playwright E2E', 'Playwright testing'],
	},
	{
		skillSlug: 'react-testing-library',
		aliases: ['RTL', 'Testing Library', '@testing-library/react'],
	},
	{ skillSlug: 'pytest', aliases: ['py.test', 'PyTest', 'Python testing'] },
	{
		skillSlug: 'selenium',
		aliases: ['selenium', 'Selenium WebDriver', 'Selenium Grid'],
	},
	{
		skillSlug: 'oauth',
		aliases: ['OAuth', 'OAuth2', 'OAuth 2.0', 'Open Authorization'],
	},
	{
		skillSlug: 'jwt',
		aliases: ['Json Web Token', 'JSON Web Token', 'jwt', 'JWT token'],
	},
	{ skillSlug: 'figma', aliases: ['figma', 'Figma Design'] },
	{
		skillSlug: 'english',
		aliases: ['english', 'English Language', 'Business English'],
	},
	{
		skillSlug: 'nepali',
		aliases: ['nepali', 'Nepalese', 'Nepali Language', 'नेपाली'],
	},
	{ skillSlug: 'hindi', aliases: ['hindi', 'Hindi Language', 'हिन्दी'] },
	{
		skillSlug: 'mandarin',
		aliases: ['Chinese', 'Mandarin Chinese', '普通话', 'mandarin'],
	},
	{
		skillSlug: 'agile',
		aliases: [
			'Scrum',
			'SCRUM',
			'Kanban',
			'Agile Methodology',
			'agile',
			'Agile/Scrum',
			'Agile Scrum',
		],
	},
	{
		skillSlug: 'project-management',
		aliases: ['PM', 'project management', 'Technical Project Management'],
	},
	{
		skillSlug: 'problem-solving',
		aliases: [
			'Problem-Solving',
			'Problem Solving',
			'Analytical Thinking',
			'Analytical Skills',
		],
	},
	{
		skillSlug: 'leadership',
		aliases: [
			'Team Leadership',
			'Technical Leadership',
			'Tech Lead',
			'Engineering Leadership',
		],
	},
	{ skillSlug: 'storybook', aliases: ['storybook', 'Storybook.js'] },
	{ skillSlug: 'sqlite', aliases: ['SQLite3', 'sqlite', 'SQLite DB'] },
];

// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Seed runner
// ---------------------------------------------------------------------------

async function seed() {
	console.info('Seeding skills...');

	// Insert skills and build slug → id map
	const slugToId = new Map<string, string>();

	for (const skill of SKILLS) {
		const [row] = await db
			.insert(skillsSchema)
			.values(skill)
			.onConflictDoUpdate({
				target: skillsSchema.slug,
				set: {
					display_name: skill.display_name,
					category: skill.category,
					difficulty: skill.difficulty,
					updated_at: new Date(),
				},
			})
			.returning({ id: skillsSchema.id, slug: skillsSchema.slug });
		slugToId.set(row.slug, row.id);
	}

	console.info(`  ✓ ${SKILLS.length} skills`);

	// Insert aliases
	let aliasCount = 0;
	for (const { skillSlug, aliases } of ALIASES) {
		const skillId = slugToId.get(skillSlug);
		if (!skillId) {
			console.warn(`  ⚠ No skill found for alias group: ${skillSlug}`);
			continue;
		}
		for (const alias of aliases) {
			await db
				.insert(skillAliasSchema)
				.values({ skill_id: skillId, alias })
				.onConflictDoUpdate({
					target: skillAliasSchema.alias,
					set: { skill_id: skillId, updated_at: new Date() },
				});
			aliasCount++;
		}
	}

	console.info(`  ✓ ${aliasCount} aliases`);
	console.info('Seed complete.');
	process.exit(0);
}

seed().catch((err) => {
	console.error(err);
	process.exit(1);
});
