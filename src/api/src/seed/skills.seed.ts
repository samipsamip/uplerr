import { skillAliasSchema } from '../schemas/skill_aliases.schema';
import { skillDependencySchema } from '../schemas/skill_dependencies.schema';
import { skillResourceSchema } from '../schemas/skill_resources.schema';
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
// Dependencies
// ---------------------------------------------------------------------------

const DEPENDENCIES: Array<{
	skill: string;
	dependsOn: string;
	importance: number;
}> = [
	// JavaScript is the foundation of the frontend stack
	{ skill: 'typescript', dependsOn: 'javascript', importance: 2 },
	{ skill: 'react', dependsOn: 'javascript', importance: 1 },
	{ skill: 'vuejs', dependsOn: 'javascript', importance: 1 },
	{ skill: 'angular', dependsOn: 'typescript', importance: 1 },
	{ skill: 'svelte', dependsOn: 'javascript', importance: 1 },
	{ skill: 'redux', dependsOn: 'javascript', importance: 1 },
	{ skill: 'redux', dependsOn: 'react', importance: 2 },
	{ skill: 'graphql', dependsOn: 'javascript', importance: 2 },
	{ skill: 'graphql', dependsOn: 'rest-api', importance: 3 },
	{ skill: 'storybook', dependsOn: 'react', importance: 2 },

	// Next.js / React Native build on React
	{ skill: 'nextjs', dependsOn: 'react', importance: 1 },
	{ skill: 'nextjs', dependsOn: 'typescript', importance: 3 },
	{ skill: 'react-native', dependsOn: 'react', importance: 1 },
	{ skill: 'react-native', dependsOn: 'javascript', importance: 1 },
	{ skill: 'expo', dependsOn: 'react-native', importance: 1 },
	{ skill: 'react-testing-library', dependsOn: 'react', importance: 1 },
	{ skill: 'react-testing-library', dependsOn: 'jest', importance: 2 },

	// Node.js ecosystem
	{ skill: 'expressjs', dependsOn: 'nodejs', importance: 1 },
	{ skill: 'nestjs', dependsOn: 'nodejs', importance: 1 },
	{ skill: 'nestjs', dependsOn: 'typescript', importance: 1 },
	{ skill: 'nestjs', dependsOn: 'expressjs', importance: 3 },
	{ skill: 'hono', dependsOn: 'nodejs', importance: 1 },
	{ skill: 'hono', dependsOn: 'typescript', importance: 2 },
	{ skill: 'prisma', dependsOn: 'nodejs', importance: 2 },
	{ skill: 'prisma', dependsOn: 'sql', importance: 2 },
	{ skill: 'drizzle-orm', dependsOn: 'nodejs', importance: 2 },
	{ skill: 'drizzle-orm', dependsOn: 'sql', importance: 2 },

	// Python ecosystem
	{ skill: 'django', dependsOn: 'python', importance: 1 },
	{ skill: 'fastapi', dependsOn: 'python', importance: 1 },
	{ skill: 'pytest', dependsOn: 'python', importance: 1 },

	// JVM
	{ skill: 'spring-boot', dependsOn: 'java', importance: 1 },
	{ skill: 'kotlin', dependsOn: 'java', importance: 3 },

	// .NET
	{ skill: 'dotnet', dependsOn: 'csharp', importance: 1 },

	// Containers and orchestration
	{ skill: 'docker', dependsOn: 'linux', importance: 2 },
	{ skill: 'kubernetes', dependsOn: 'docker', importance: 1 },
	{ skill: 'kubernetes', dependsOn: 'linux', importance: 2 },
	{ skill: 'helm', dependsOn: 'kubernetes', importance: 1 },
	{ skill: 'argocd', dependsOn: 'kubernetes', importance: 2 },
	{ skill: 'argocd', dependsOn: 'helm', importance: 2 },

	// Infrastructure
	{ skill: 'terraform', dependsOn: 'aws', importance: 3 },
	{ skill: 'ansible', dependsOn: 'linux', importance: 2 },
	{ skill: 'nginx', dependsOn: 'linux', importance: 2 },
	{ skill: 'jenkins', dependsOn: 'linux', importance: 2 },
	{ skill: 'github-actions', dependsOn: 'git', importance: 2 },

	// Cloud specifics
	{ skill: 'aws-lambda', dependsOn: 'aws', importance: 1 },
	{ skill: 'cloud-run', dependsOn: 'gcp', importance: 1 },
	{ skill: 'supabase', dependsOn: 'postgresql', importance: 2 },
	{ skill: 'firebase', dependsOn: 'javascript', importance: 2 },

	// Databases
	{ skill: 'postgresql', dependsOn: 'sql', importance: 2 },
	{ skill: 'mysql', dependsOn: 'sql', importance: 2 },
	{ skill: 'clickhouse', dependsOn: 'sql', importance: 2 },
	{ skill: 'elasticsearch', dependsOn: 'sql', importance: 3 },
	{ skill: 'kafka', dependsOn: 'linux', importance: 2 },

	// Testing
	{ skill: 'jest', dependsOn: 'javascript', importance: 1 },
	{ skill: 'vitest', dependsOn: 'javascript', importance: 1 },
	{ skill: 'vitest', dependsOn: 'vite', importance: 2 },
	{ skill: 'cypress', dependsOn: 'javascript', importance: 1 },
	{ skill: 'playwright', dependsOn: 'javascript', importance: 1 },
	{ skill: 'k6', dependsOn: 'javascript', importance: 2 },

	// Security
	{ skill: 'jwt', dependsOn: 'rest-api', importance: 1 },
	{ skill: 'oauth', dependsOn: 'rest-api', importance: 1 },

	// Build tools
	{ skill: 'webpack', dependsOn: 'javascript', importance: 2 },
	{ skill: 'vite', dependsOn: 'javascript', importance: 1 },
];

// ---------------------------------------------------------------------------
// Resources
// ---------------------------------------------------------------------------

const RESOURCES: Array<{
	skillSlug: string;
	title: string;
	url: string;
	type: string;
	platform: string | null;
	is_free: boolean;
	description: string | null;
	sort_order: number;
}> = [
	// JavaScript
	{
		skillSlug: 'javascript',
		title: 'MDN JavaScript Guide',
		url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide',
		type: 'docs',
		platform: 'MDN',
		is_free: true,
		description:
			'Comprehensive reference from Mozilla. The definitive source for JS behaviour.',
		sort_order: 0,
	},
	{
		skillSlug: 'javascript',
		title: 'javascript.info',
		url: 'https://javascript.info',
		type: 'tutorial',
		platform: 'javascript.info',
		is_free: true,
		description:
			'Modern, well-structured tutorial from fundamentals to advanced topics.',
		sort_order: 1,
	},
	{
		skillSlug: 'javascript',
		title: 'freeCodeCamp JavaScript Algorithms',
		url: 'https://www.freecodecamp.org/learn/javascript-algorithms-and-data-structures/',
		type: 'course',
		platform: 'freeCodeCamp',
		is_free: true,
		description:
			'Hands-on coding challenges with a free certificate on completion.',
		sort_order: 2,
	},

	// TypeScript
	{
		skillSlug: 'typescript',
		title: 'TypeScript Official Docs',
		url: 'https://www.typescriptlang.org/docs/',
		type: 'docs',
		platform: 'TypeScript',
		is_free: true,
		description: 'Official handbook — covers the type system thoroughly.',
		sort_order: 0,
	},
	{
		skillSlug: 'typescript',
		title: 'TypeScript Deep Dive',
		url: 'https://basarat.gitbook.io/typescript/',
		type: 'tutorial',
		platform: null,
		is_free: true,
		description:
			'Free book by Basarat — great for developers coming from JavaScript.',
		sort_order: 1,
	},
	{
		skillSlug: 'typescript',
		title: 'Matt Pocock TypeScript Tips',
		url: 'https://www.totaltypescript.com/tips',
		type: 'article',
		platform: 'Total TypeScript',
		is_free: true,
		description: 'Short, practical tips on advanced TypeScript patterns.',
		sort_order: 2,
	},

	// React
	{
		skillSlug: 'react',
		title: 'React Official Docs',
		url: 'https://react.dev',
		type: 'docs',
		platform: 'React',
		is_free: true,
		description:
			'New docs built with interactive examples. The best starting point.',
		sort_order: 0,
	},
	{
		skillSlug: 'react',
		title: 'freeCodeCamp React Course',
		url: 'https://www.freecodecamp.org/learn/front-end-development-libraries/#react',
		type: 'course',
		platform: 'freeCodeCamp',
		is_free: true,
		description: 'Solid foundational course with a free certificate.',
		sort_order: 1,
	},

	// Next.js
	{
		skillSlug: 'nextjs',
		title: 'Next.js Official Docs',
		url: 'https://nextjs.org/docs',
		type: 'docs',
		platform: 'Next.js',
		is_free: true,
		description:
			'Complete reference for the App Router and all Next.js features.',
		sort_order: 0,
	},
	{
		skillSlug: 'nextjs',
		title: 'Learn Next.js',
		url: 'https://nextjs.org/learn',
		type: 'course',
		platform: 'Next.js',
		is_free: true,
		description:
			'Official interactive course — builds a real dashboard app step-by-step.',
		sort_order: 1,
	},

	// Node.js
	{
		skillSlug: 'nodejs',
		title: 'Node.js Official Docs',
		url: 'https://nodejs.org/en/docs',
		type: 'docs',
		platform: 'Node.js',
		is_free: true,
		description: 'Full API reference and guides.',
		sort_order: 0,
	},
	{
		skillSlug: 'nodejs',
		title: 'The Odin Project — Node.js',
		url: 'https://www.theodinproject.com/paths/full-stack-javascript/courses/nodejs',
		type: 'course',
		platform: 'The Odin Project',
		is_free: true,
		description: 'Project-based curriculum with real apps to build.',
		sort_order: 1,
	},

	// Python
	{
		skillSlug: 'python',
		title: 'Python Official Tutorial',
		url: 'https://docs.python.org/3/tutorial/',
		type: 'docs',
		platform: 'Python',
		is_free: true,
		description: 'The official tutorial — concise and accurate.',
		sort_order: 0,
	},
	{
		skillSlug: 'python',
		title: 'Real Python Tutorials',
		url: 'https://realpython.com',
		type: 'tutorial',
		platform: 'Real Python',
		is_free: false,
		description:
			'High-quality Python tutorials for all levels. Some free, some behind paywall.',
		sort_order: 1,
	},
	{
		skillSlug: 'python',
		title: 'CS50P — Introduction to Python',
		url: 'https://cs50.harvard.edu/python/',
		type: 'course',
		platform: 'Harvard / edX',
		is_free: true,
		description:
			'Free Harvard course. Excellent for beginners and career-switchers.',
		sort_order: 2,
	},

	// Docker
	{
		skillSlug: 'docker',
		title: 'Docker Official Docs',
		url: 'https://docs.docker.com',
		type: 'docs',
		platform: 'Docker',
		is_free: true,
		description:
			'Complete reference for Docker CLI, Compose, and Dockerfile syntax.',
		sort_order: 0,
	},
	{
		skillSlug: 'docker',
		title: 'Play With Docker',
		url: 'https://labs.play-with-docker.com',
		type: 'tutorial',
		platform: 'Docker',
		is_free: true,
		description: 'Browser-based Docker playground — no local install needed.',
		sort_order: 1,
	},

	// Kubernetes
	{
		skillSlug: 'kubernetes',
		title: 'Kubernetes Official Docs',
		url: 'https://kubernetes.io/docs/home/',
		type: 'docs',
		platform: 'Kubernetes',
		is_free: true,
		description: 'Full reference for all Kubernetes concepts and resources.',
		sort_order: 0,
	},
	{
		skillSlug: 'kubernetes',
		title: 'Kubernetes Basics Tutorial',
		url: 'https://kubernetes.io/docs/tutorials/kubernetes-basics/',
		type: 'tutorial',
		platform: 'Kubernetes',
		is_free: true,
		description: 'Interactive hands-on tutorial from the official K8s site.',
		sort_order: 1,
	},

	// AWS
	{
		skillSlug: 'aws',
		title: 'AWS Documentation',
		url: 'https://docs.aws.amazon.com',
		type: 'docs',
		platform: 'AWS',
		is_free: true,
		description: 'Full AWS service documentation.',
		sort_order: 0,
	},
	{
		skillSlug: 'aws',
		title: 'AWS Skill Builder',
		url: 'https://skillbuilder.aws',
		type: 'course',
		platform: 'AWS',
		is_free: false,
		description:
			'Official AWS training platform. Many free courses, paid certs.',
		sort_order: 1,
	},

	// PostgreSQL
	{
		skillSlug: 'postgresql',
		title: 'PostgreSQL Official Docs',
		url: 'https://www.postgresql.org/docs/',
		type: 'docs',
		platform: 'PostgreSQL',
		is_free: true,
		description:
			'Comprehensive Postgres reference — excellent search functionality.',
		sort_order: 0,
	},
	{
		skillSlug: 'postgresql',
		title: 'PostgreSQL Tutorial',
		url: 'https://www.postgresqltutorial.com',
		type: 'tutorial',
		platform: 'postgresqltutorial.com',
		is_free: true,
		description:
			'Practical exercises covering queries, indexes, and performance.',
		sort_order: 1,
	},

	// SQL
	{
		skillSlug: 'sql',
		title: 'SQLZoo',
		url: 'https://sqlzoo.net',
		type: 'tutorial',
		platform: 'SQLZoo',
		is_free: true,
		description:
			'Interactive SQL exercises from SELECT basics to advanced JOINs.',
		sort_order: 0,
	},
	{
		skillSlug: 'sql',
		title: 'W3Schools SQL',
		url: 'https://www.w3schools.com/sql/',
		type: 'tutorial',
		platform: 'W3Schools',
		is_free: true,
		description:
			'Quick reference with runnable examples. Good for syntax lookups.',
		sort_order: 1,
	},

	// MongoDB
	{
		skillSlug: 'mongodb',
		title: 'MongoDB University',
		url: 'https://university.mongodb.com',
		type: 'course',
		platform: 'MongoDB',
		is_free: true,
		description:
			'Free official courses covering CRUD, aggregation, and schema design.',
		sort_order: 0,
	},
	{
		skillSlug: 'mongodb',
		title: 'MongoDB Docs',
		url: 'https://www.mongodb.com/docs/',
		type: 'docs',
		platform: 'MongoDB',
		is_free: true,
		description:
			'Full reference including Atlas, drivers, and query operators.',
		sort_order: 1,
	},

	// Redis
	{
		skillSlug: 'redis',
		title: 'Redis University',
		url: 'https://university.redis.com',
		type: 'course',
		platform: 'Redis',
		is_free: true,
		description:
			'Free self-paced courses on caching, streams, and data structures.',
		sort_order: 0,
	},
	{
		skillSlug: 'redis',
		title: 'Redis Official Docs',
		url: 'https://redis.io/docs/',
		type: 'docs',
		platform: 'Redis',
		is_free: true,
		description: 'Command reference and architecture guides.',
		sort_order: 1,
	},

	// GraphQL
	{
		skillSlug: 'graphql',
		title: 'GraphQL Official Docs',
		url: 'https://graphql.org/learn/',
		type: 'docs',
		platform: 'GraphQL',
		is_free: true,
		description: 'Official spec and learning resources.',
		sort_order: 0,
	},
	{
		skillSlug: 'graphql',
		title: 'How to GraphQL',
		url: 'https://www.howtographql.com',
		type: 'tutorial',
		platform: 'howtographql.com',
		is_free: true,
		description: 'Full-stack tutorials for both client and server GraphQL.',
		sort_order: 1,
	},

	// Linux
	{
		skillSlug: 'linux',
		title: 'Linux Journey',
		url: 'https://linuxjourney.com',
		type: 'tutorial',
		platform: 'linuxjourney.com',
		is_free: true,
		description:
			'Gamified intro to Linux — covers shell, processes, permissions.',
		sort_order: 0,
	},
	{
		skillSlug: 'linux',
		title: 'The Odin Project — Command Line',
		url: 'https://www.theodinproject.com/lessons/foundations-command-line-basics',
		type: 'tutorial',
		platform: 'The Odin Project',
		is_free: true,
		description: 'Practical command line basics for developers.',
		sort_order: 1,
	},

	// Terraform
	{
		skillSlug: 'terraform',
		title: 'Terraform Docs',
		url: 'https://developer.hashicorp.com/terraform/docs',
		type: 'docs',
		platform: 'HashiCorp',
		is_free: true,
		description: 'Full Terraform language reference and provider docs.',
		sort_order: 0,
	},
	{
		skillSlug: 'terraform',
		title: 'HashiCorp Learn — Terraform',
		url: 'https://developer.hashicorp.com/terraform/tutorials',
		type: 'tutorial',
		platform: 'HashiCorp',
		is_free: true,
		description:
			'Hands-on tutorials for AWS, GCP, Azure, and local development.',
		sort_order: 1,
	},

	// Go
	{
		skillSlug: 'golang',
		title: 'A Tour of Go',
		url: 'https://go.dev/tour/',
		type: 'tutorial',
		platform: 'Go',
		is_free: true,
		description: 'Official interactive tour — the best way to start with Go.',
		sort_order: 0,
	},
	{
		skillSlug: 'golang',
		title: 'Go Official Docs',
		url: 'https://go.dev/doc/',
		type: 'docs',
		platform: 'Go',
		is_free: true,
		description: 'Standard library reference and effective Go guide.',
		sort_order: 1,
	},

	// Rust
	{
		skillSlug: 'rust',
		title: 'The Rust Programming Language',
		url: 'https://doc.rust-lang.org/book/',
		type: 'docs',
		platform: 'Rust',
		is_free: true,
		description:
			'The official book — comprehensive, well-written, free online.',
		sort_order: 0,
	},
	{
		skillSlug: 'rust',
		title: 'Rustlings',
		url: 'https://github.com/rust-lang/rustlings',
		type: 'tutorial',
		platform: 'Rust',
		is_free: true,
		description:
			'Small exercises to get used to reading and writing Rust code.',
		sort_order: 1,
	},

	// HTML
	{
		skillSlug: 'html',
		title: 'MDN HTML Guide',
		url: 'https://developer.mozilla.org/en-US/docs/Learn/HTML',
		type: 'docs',
		platform: 'MDN',
		is_free: true,
		description: "Mozilla's structured introduction to HTML.",
		sort_order: 0,
	},

	// CSS
	{
		skillSlug: 'css',
		title: 'MDN CSS Guide',
		url: 'https://developer.mozilla.org/en-US/docs/Learn/CSS',
		type: 'docs',
		platform: 'MDN',
		is_free: true,
		description: "Mozilla's CSS learning path from basics to layout.",
		sort_order: 0,
	},
	{
		skillSlug: 'css',
		title: 'CSS Tricks',
		url: 'https://css-tricks.com',
		type: 'article',
		platform: 'CSS-Tricks',
		is_free: true,
		description:
			'Articles, guides, and the definitive Flexbox and Grid references.',
		sort_order: 1,
	},

	// Git
	{
		skillSlug: 'git',
		title: 'Pro Git Book',
		url: 'https://git-scm.com/book/en/v2',
		type: 'docs',
		platform: 'Git',
		is_free: true,
		description: 'The complete Git book — free online in multiple languages.',
		sort_order: 0,
	},
	{
		skillSlug: 'git',
		title: 'Oh My Git!',
		url: 'https://ohmygit.org',
		type: 'tutorial',
		platform: 'ohmygit.org',
		is_free: true,
		description: 'Game-based Git learning — great for visual learners.',
		sort_order: 1,
	},

	// Jest
	{
		skillSlug: 'jest',
		title: 'Jest Official Docs',
		url: 'https://jestjs.io/docs/getting-started',
		type: 'docs',
		platform: 'Jest',
		is_free: true,
		description: 'Full API reference and configuration guide.',
		sort_order: 0,
	},

	// Playwright
	{
		skillSlug: 'playwright',
		title: 'Playwright Official Docs',
		url: 'https://playwright.dev/docs/intro',
		type: 'docs',
		platform: 'Playwright',
		is_free: true,
		description: 'Getting started guide and full API reference.',
		sort_order: 0,
	},

	// Tailwind CSS
	{
		skillSlug: 'tailwindcss',
		title: 'Tailwind CSS Docs',
		url: 'https://tailwindcss.com/docs',
		type: 'docs',
		platform: 'Tailwind CSS',
		is_free: true,
		description: 'Searchable utility class reference with live examples.',
		sort_order: 0,
	},

	// Express.js
	{
		skillSlug: 'expressjs',
		title: 'Express.js Official Docs',
		url: 'https://expressjs.com',
		type: 'docs',
		platform: 'Express.js',
		is_free: true,
		description: 'Routing, middleware, and API reference.',
		sort_order: 0,
	},

	// FastAPI
	{
		skillSlug: 'fastapi',
		title: 'FastAPI Official Docs',
		url: 'https://fastapi.tiangolo.com',
		type: 'docs',
		platform: 'FastAPI',
		is_free: true,
		description: 'Excellent docs with interactive API explorer built in.',
		sort_order: 0,
	},

	// Django
	{
		skillSlug: 'django',
		title: 'Django Official Docs',
		url: 'https://docs.djangoproject.com',
		type: 'docs',
		platform: 'Django',
		is_free: true,
		description: 'Complete Django reference including ORM, views, and auth.',
		sort_order: 0,
	},
	{
		skillSlug: 'django',
		title: 'Django Girls Tutorial',
		url: 'https://tutorial.djangogirls.org',
		type: 'tutorial',
		platform: 'Django Girls',
		is_free: true,
		description: 'Beginner-friendly tutorial building a blog from scratch.',
		sort_order: 1,
	},

	// Vue.js
	{
		skillSlug: 'vuejs',
		title: 'Vue.js Official Docs',
		url: 'https://vuejs.org/guide/introduction.html',
		type: 'docs',
		platform: 'Vue.js',
		is_free: true,
		description: 'Covers both Composition and Options APIs clearly.',
		sort_order: 0,
	},

	// Angular
	{
		skillSlug: 'angular',
		title: 'Angular Official Docs',
		url: 'https://angular.dev',
		type: 'docs',
		platform: 'Angular',
		is_free: true,
		description: 'New unified documentation with interactive tutorials.',
		sort_order: 0,
	},

	// Java
	{
		skillSlug: 'java',
		title: 'Oracle Java Tutorials',
		url: 'https://docs.oracle.com/javase/tutorial/',
		type: 'tutorial',
		platform: 'Oracle',
		is_free: true,
		description: 'Official Java learning trail from Oracle.',
		sort_order: 0,
	},
	{
		skillSlug: 'java',
		title: 'Baeldung',
		url: 'https://www.baeldung.com',
		type: 'tutorial',
		platform: 'Baeldung',
		is_free: false,
		description:
			'High-quality Java and Spring tutorials. Best source for backend Java.',
		sort_order: 1,
	},

	// Spring Boot
	{
		skillSlug: 'spring-boot',
		title: 'Spring Boot Guides',
		url: 'https://spring.io/guides',
		type: 'tutorial',
		platform: 'Spring',
		is_free: true,
		description:
			'Short, task-focused guides covering all major Spring use cases.',
		sort_order: 0,
	},
	{
		skillSlug: 'spring-boot',
		title: 'Spring Boot Reference Docs',
		url: 'https://docs.spring.io/spring-boot/docs/current/reference/html/',
		type: 'docs',
		platform: 'Spring',
		is_free: true,
		description: 'Full reference documentation.',
		sort_order: 1,
	},

	// GitHub Actions
	{
		skillSlug: 'github-actions',
		title: 'GitHub Actions Docs',
		url: 'https://docs.github.com/en/actions',
		type: 'docs',
		platform: 'GitHub',
		is_free: true,
		description:
			'Workflow syntax, triggers, and marketplace actions reference.',
		sort_order: 0,
	},

	// Prisma
	{
		skillSlug: 'prisma',
		title: 'Prisma Docs',
		url: 'https://www.prisma.io/docs',
		type: 'docs',
		platform: 'Prisma',
		is_free: true,
		description: 'Schema definition, queries, migrations, and client API.',
		sort_order: 0,
	},

	// Drizzle ORM
	{
		skillSlug: 'drizzle-orm',
		title: 'Drizzle ORM Docs',
		url: 'https://orm.drizzle.team/docs/overview',
		type: 'docs',
		platform: 'Drizzle',
		is_free: true,
		description: 'Full reference for Drizzle schema, queries, and migrations.',
		sort_order: 0,
	},

	// Figma
	{
		skillSlug: 'figma',
		title: 'Figma Learn',
		url: 'https://www.figma.com/resources/learn-design/',
		type: 'docs',
		platform: 'Figma',
		is_free: true,
		description: 'Official Figma learning resources and design fundamentals.',
		sort_order: 0,
	},

	// Agile / Scrum
	{
		skillSlug: 'agile',
		title: 'Scrum Guide',
		url: 'https://scrumguides.org/scrum-guide.html',
		type: 'docs',
		platform: null,
		is_free: true,
		description: 'The official Scrum Guide — the authoritative reference.',
		sort_order: 0,
	},
	{
		skillSlug: 'agile',
		title: 'Atlassian Agile Guide',
		url: 'https://www.atlassian.com/agile',
		type: 'article',
		platform: 'Atlassian',
		is_free: true,
		description: 'Practical guides on Scrum, Kanban, and team ceremonies.',
		sort_order: 1,
	},
];

// ---------------------------------------------------------------------------
// Seed runner
// ---------------------------------------------------------------------------

async function seed() {
	console.log('Seeding skills...');

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

	console.log(`  ✓ ${SKILLS.length} skills`);

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

	console.log(`  ✓ ${aliasCount} aliases`);

	// Resolve all skills by slug for dependency lookup
	const allSkills = await db
		.select({ id: skillsSchema.id, slug: skillsSchema.slug })
		.from(skillsSchema);
	const allSlugsMap = new Map(allSkills.map((s) => [s.slug, s.id]));

	// Insert dependencies
	let depCount = 0;
	for (const { skill, dependsOn, importance } of DEPENDENCIES) {
		const skillId = allSlugsMap.get(skill);
		const depId = allSlugsMap.get(dependsOn);
		if (!skillId || !depId) {
			console.warn(
				`  ⚠ Skipping dependency ${skill} → ${dependsOn} (slug not found)`,
			);
			continue;
		}
		await db
			.insert(skillDependencySchema)
			.values({ skill_id: skillId, depends_on_skill_id: depId, importance })
			.onConflictDoNothing();
		depCount++;
	}

	console.log(`  ✓ ${depCount} dependencies`);

	// Insert resources
	let resourceCount = 0;
	for (const resource of RESOURCES) {
		const skillId = allSlugsMap.get(resource.skillSlug);
		if (!skillId) {
			console.warn(`  ⚠ No skill found for resource: ${resource.skillSlug}`);
			continue;
		}
		//seed file - let's skip
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const { skillSlug: _slug, ...values } = resource;
		await db
			.insert(skillResourceSchema)
			.values({ ...values, skill_id: skillId })
			.onConflictDoNothing();
		resourceCount++;
	}

	console.log(`  ✓ ${resourceCount} resources`);
	console.log('Seed complete.');
	process.exit(0);
}

seed().catch((err) => {
	console.error(err);
	process.exit(1);
});
