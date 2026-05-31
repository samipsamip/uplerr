import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import type { CvStructuredData } from '@uppler/types';

import { AiSidebar } from '@/components/dashboard/resume-review/ai-sidebar';

import { renderWithProviders } from '../../../helpers/render';

const baseData: CvStructuredData = {
	extraction: {
		full_name: 'Alice',
		contact_details: {
			email: 'alice@example.com',
			phone: '0400000000',
			location: 'Sydney, AU',
			linkedin: 'https://li.com',
			vcs_platform: 'GitHub',
			vcs_url: 'https://gh.com',
			portfolio: 'https://alice.dev',
		},
		professional_summary: null,
		work_history: [
			{
				role: 'Senior Engineer',
				company: 'Acme',
				start_date: { raw: 'Jan 2020', normalized: '2020-01-01' },
				end_date: { raw: null, normalized: null },
				is_current: true,
				bullet_points: [
					'Built React and TypeScript applications with Docker deployments on AWS.',
					'Led a team of 5 engineers and reduced system latency by 40% through caching strategies.',
				],
			},
			{
				role: 'Software Developer',
				company: 'Startup',
				start_date: { raw: 'Jun 2018', normalized: '2018-06-01' },
				end_date: { raw: 'Dec 2019', normalized: '2019-12-01' },
				is_current: false,
				bullet_points: [
					'Developed Node.js microservices and PostgreSQL database schemas.',
					'Implemented CI/CD pipelines using GitHub Actions.',
				],
			},
		],
		education: [
			{
				institution: 'Uni',
				degree: "Bachelor's of Computer Science",
				field_of_study: 'Computer Science',
				start_date: { raw: null, normalized: null },
				end_date: { raw: '2019', normalized: null },
			},
		],
		certifications: [],
		notable_achievements: [],
	},
	skills: {
		technical_skills: [
			{ name: 'React', source: 'skills_section' },
			{ name: 'TypeScript', source: 'skills_section' },
			{ name: 'Node.js', source: 'skills_section' },
			{ name: 'Docker', source: 'skills_section' },
			{ name: 'PostgreSQL', source: 'skills_section' },
			{ name: 'AWS', source: 'skills_section' },
			{ name: 'Kubernetes', source: 'skills_section' },
			{ name: 'Terraform', source: 'skills_section' },
			{ name: 'Python', source: 'skills_section' },
		],
		tools_platforms: [
			{ name: 'Git', source: 'skills_section' },
			{ name: 'Redis', source: 'skills_section' },
			{ name: 'GraphQL', source: 'skills_section' },
			{ name: 'Jest', source: 'skills_section' },
			{ name: 'Vite', source: 'skills_section' },
		],
		spoken_languages: [],
		soft_skills: [],
	},
	projects: {
		projects: [],
	},
};

const emptyData: CvStructuredData = {
	extraction: {
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
	},
	skills: {
		technical_skills: [],
		tools_platforms: [],
		spoken_languages: [],
		soft_skills: [],
	},
	projects: {
		projects: [],
	},
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
		renderWithProviders(<AiSidebar data={emptyData} />);
		expect(screen.getByText('Building')).toBeInTheDocument();
	});

	it('renders all completeness factor labels', () => {
		renderWithProviders(<AiSidebar data={baseData} />);
		expect(screen.getByText('Identity')).toBeInTheDocument();
		expect(screen.getByText('Contact')).toBeInTheDocument();
		expect(screen.getByText('Online presence')).toBeInTheDocument();
		expect(screen.getByText('Work experience')).toBeInTheDocument();
		expect(screen.getByText('Education')).toBeInTheDocument();
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
		expect(screen.getByText(/of work experience/i)).toBeInTheDocument();
	});

	it('does not show years of experience when no durations are present', () => {
		renderWithProviders(
			<AiSidebar
				data={{
					...baseData,
					extraction: {
						...baseData.extraction,
						work_history: [
							{
								role: 'Dev',
								company: 'A',
								start_date: { raw: null, normalized: null },
								end_date: { raw: null, normalized: null },
								is_current: false,
								bullet_points: [],
							},
						],
					},
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
					extraction: {
						...baseData.extraction,
						contact_details: {
							...baseData.extraction.contact_details,
							linkedin: null,
							vcs_url: null,
							portfolio: null,
						},
					},
				}}
			/>,
		);
		expect(screen.getByText(/suggestions/i)).toBeInTheDocument();
	});

	it('does not show Suggestions section for a fully complete profile', () => {
		renderWithProviders(<AiSidebar data={baseData} />);
		expect(screen.queryByText(/^suggestions$/i)).not.toBeInTheDocument();
	});

	it('shows suggested skills when the profile type has known gaps', () => {
		const frontendData: CvStructuredData = {
			...baseData,
			skills: {
				technical_skills: [
					{ name: 'React', source: 'skills_section' },
					{ name: 'Vue', source: 'skills_section' },
					{ name: 'Angular', source: 'skills_section' },
					{ name: 'TypeScript', source: 'skills_section' },
				],
				tools_platforms: [],
				spoken_languages: [],
				soft_skills: [],
			},
		};
		renderWithProviders(<AiSidebar data={frontendData} />);
		expect(screen.getByText(/consider adding/i)).toBeInTheDocument();
	});
});

describe('AiSidebar — Skill Distribution', () => {
	it('renders Skill Distribution heading when skills exist', () => {
		renderWithProviders(<AiSidebar data={baseData} />);
		expect(screen.getByText(/skill distribution/i)).toBeInTheDocument();
	});

	it('does not render Skill Distribution when there are no skills', () => {
		renderWithProviders(<AiSidebar data={emptyData} />);
		expect(screen.queryByText(/skill distribution/i)).not.toBeInTheDocument();
	});

	it('shows the total skill count', () => {
		renderWithProviders(<AiSidebar data={baseData} />);
		const total =
			baseData.skills.technical_skills.length +
			baseData.skills.tools_platforms.length;
		expect(screen.getByText(`${total} total`)).toBeInTheDocument();
	});
});
