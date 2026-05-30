import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';

import { AiSidebar } from '@/components/dashboard/resume-review/ai-sidebar';

import { renderWithProviders } from '../../../helpers/render';

// Designed to score >= 85 (Excellent): all fields, many skills, 2 rich experience entries
const baseData = {
	name: 'Alice',
	email: 'alice@example.com',
	phone: '0400000000',
	location: 'Sydney, AU',
	links: {
		linkedin: 'https://li.com',
		github: 'https://gh.com',
		portfolio: 'https://alice.dev',
	},
	skills: [
		'React',
		'TypeScript',
		'Node.js',
		'Docker',
		'PostgreSQL',
		'Git',
		'AWS',
		'Redis',
		'GraphQL',
		'Kubernetes',
		'Terraform',
		'Python',
		'Jest',
		'Vite',
	],
	experience: [
		{
			role: 'Senior Engineer',
			company: 'Acme',
			duration: 'Jan 2020 – Present',
			description:
				'Built React and TypeScript applications with Docker deployments on AWS. Led a team of 5 engineers and reduced system latency by 40% through caching strategies.',
		},
		{
			role: 'Software Developer',
			company: 'Startup',
			duration: 'Jun 2018 – Dec 2019',
			description:
				'Developed Node.js microservices and PostgreSQL database schemas. Implemented CI/CD pipelines using GitHub Actions reducing deployment time significantly.',
		},
	],
	education: [
		{
			degree: "Bachelor's of Computer Science",
			institution: 'Uni',
			year: '2019',
		},
	],
	projects: [{ name: 'My App', description: 'Cool', technologies: ['React'] }],
};

describe('AiSidebar — profile strength', () => {
	it('renders the Profile Strength section heading', () => {
		renderWithProviders(<AiSidebar data={baseData} />);
		expect(screen.getByText(/profile strength/i)).toBeInTheDocument();
	});

	it('displays a percentage', () => {
		renderWithProviders(<AiSidebar data={baseData} />);
		expect(screen.getByText(/%$/)).toBeInTheDocument();
	});

	it('shows Excellent badge for a fully complete profile', () => {
		renderWithProviders(<AiSidebar data={baseData} />);
		expect(screen.getByText('Excellent')).toBeInTheDocument();
	});

	it('shows Building for empty data', () => {
		renderWithProviders(
			<AiSidebar
				data={{
					name: '',
					skills: [],
					experience: [],
					education: [],
					projects: [],
				}}
			/>,
		);
		expect(screen.getByText('Building')).toBeInTheDocument();
	});

	it('renders all completeness factor labels', () => {
		renderWithProviders(<AiSidebar data={baseData} />);
		expect(screen.getByText('Identity')).toBeInTheDocument();
		expect(screen.getByText('Contact')).toBeInTheDocument();
		expect(screen.getByText('Online presence')).toBeInTheDocument();
		expect(screen.getByText('Work experience')).toBeInTheDocument();
		expect(screen.getByText('Education')).toBeInTheDocument();
		expect(screen.getByText('Projects')).toBeInTheDocument();
	});
});

describe('AiSidebar — AI Analysis', () => {
	it('renders the AI Analysis heading', () => {
		renderWithProviders(<AiSidebar data={baseData} />);
		expect(screen.getByText(/ai analysis/i)).toBeInTheDocument();
	});

	it('shows the detected profile type', () => {
		renderWithProviders(<AiSidebar data={baseData} />);
		expect(screen.getByText(/engineer/i)).toBeInTheDocument();
	});

	it('shows estimated years of experience when parseable', () => {
		renderWithProviders(<AiSidebar data={baseData} />);
		// "~N years" is in a <span> and "of work experience" is adjacent text
		expect(screen.getByText(/of work experience/i)).toBeInTheDocument();
	});

	it('does not show years of experience when no durations are present', () => {
		renderWithProviders(
			<AiSidebar
				data={{
					...baseData,
					experience: [{ role: 'Dev', company: 'A' }],
				}}
			/>,
		);
		expect(
			screen.queryByText(/years? of work experience/i),
		).not.toBeInTheDocument();
	});

	it('shows education level when detectable', () => {
		renderWithProviders(<AiSidebar data={baseData} />);
		expect(screen.getByText(/bachelor/i)).toBeInTheDocument();
	});

	it('shows roles extracted count', () => {
		renderWithProviders(<AiSidebar data={baseData} />);
		expect(
			screen.getByText(/roles? (extracted|look good)/i),
		).toBeInTheDocument();
	});

	it('shows skills backed by experience count', () => {
		renderWithProviders(<AiSidebar data={baseData} />);
		expect(
			screen.getByText(/skills? backed by experience/i),
		).toBeInTheDocument();
	});

	it('shows skill catalog match count when skillMatchMeta is provided', () => {
		renderWithProviders(
			<AiSidebar data={baseData} skillMatchMeta={{ matched: 5, total: 8 }} />,
		);
		expect(
			screen.getByText(/skills recognized in our catalog/i),
		).toBeInTheDocument();
	});

	it('does not show catalog match row when skillMatchMeta is absent', () => {
		renderWithProviders(<AiSidebar data={baseData} />);
		expect(
			screen.queryByText(/skills recognized in our catalog/i),
		).not.toBeInTheDocument();
	});
});

describe('AiSidebar — Suggestions', () => {
	it('shows the Suggestions heading when there are tips', () => {
		renderWithProviders(
			<AiSidebar
				data={{
					...baseData,
					links: {},
					projects: [],
				}}
			/>,
		);
		expect(screen.getByText(/suggestions/i)).toBeInTheDocument();
	});

	it('does not show Suggestions section for a fully complete profile', () => {
		// baseData has all links, 14+ skills, rich experience, education, projects → no tips
		renderWithProviders(<AiSidebar data={baseData} />);
		expect(screen.queryByText(/^suggestions$/i)).not.toBeInTheDocument();
	});

	it('shows suggested skills when the profile type has known gaps', () => {
		// 4 frontend skills → "Frontend-focused profile detected" → suggests Git, Vite etc.
		const frontendData = {
			...baseData,
			skills: ['React', 'Vue', 'Angular', 'TypeScript'],
			links: { linkedin: 'l', github: 'g', portfolio: 'p' },
		};
		renderWithProviders(<AiSidebar data={frontendData} />);
		// "Consider adding: X, Y" — text may be split by span, check partial
		expect(screen.getByText(/consider adding/i)).toBeInTheDocument();
	});
});

describe('AiSidebar — Skill Distribution', () => {
	it('renders Skill Distribution heading when skills exist', () => {
		renderWithProviders(<AiSidebar data={baseData} />);
		expect(screen.getByText(/skill distribution/i)).toBeInTheDocument();
	});

	it('does not render Skill Distribution when there are no skills', () => {
		renderWithProviders(<AiSidebar data={{ ...baseData, skills: [] }} />);
		expect(screen.queryByText(/skill distribution/i)).not.toBeInTheDocument();
	});

	it('shows the total skill count', () => {
		renderWithProviders(<AiSidebar data={baseData} />);
		expect(
			screen.getByText(`${baseData.skills.length} total`),
		).toBeInTheDocument();
	});
});
