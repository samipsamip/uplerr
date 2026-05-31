import { describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { CvStructuredData } from '@uppler/types';

import { ReviewContent } from '@/components/dashboard/resume-review/review-content';

import { renderWithProviders } from '../../../helpers/render';

const mockNavigate = vi.fn();

vi.mock('react-router', async (importOriginal) => {
	const actual = await importOriginal<typeof import('react-router')>();
	return { ...actual, useNavigate: () => mockNavigate };
});

beforeEach(() => vi.clearAllMocks());

const baseData: CvStructuredData = {
	extraction: {
		full_name: 'Alice Johnson',
		contact_details: {
			email: 'alice@example.com',
			phone: '0400000000',
			location: 'Sydney, AU',
			linkedin: 'https://linkedin.com/in/alice',
			vcs_platform: 'GitHub',
			vcs_url: 'https://github.com/alice',
			portfolio: 'https://alice.dev',
		},
		professional_summary: null,
		work_history: [
			{
				role: 'Senior Engineer',
				company: 'Acme Corp',
				start_date: { raw: 'Jan 2021', normalized: '2021-01-01' },
				end_date: { raw: null, normalized: null },
				is_current: true,
				bullet_points: ['Led team', 'Shipped features'],
			},
		],
		education: [
			{
				institution: 'Tech University',
				degree: 'Bachelor of Computer Science',
				field_of_study: 'CS',
				start_date: { raw: null, normalized: null },
				end_date: { raw: '2020', normalized: null },
			},
		],
		certifications: [],
		notable_achievements: [],
	},
	skills: {
		technical_skills: [
			{ name: 'React', source: 'skills_section' },
			{ name: 'TypeScript', source: 'skills_section' },
		],
		tools_platforms: [{ name: 'Docker', source: 'skills_section' }],
		spoken_languages: [],
		soft_skills: [],
	},
	projects: {
		projects: [
			{
				name: 'My Project',
				description: 'A cool project',
				technologies: ['React'],
				links: [],
				type: 'solo',
				source: 'projects_section',
			},
		],
	},
};

const emptySkillsData: CvStructuredData = {
	...baseData,
	skills: {
		technical_skills: [],
		tools_platforms: [],
		spoken_languages: [],
		soft_skills: [],
	},
};

describe('ReviewContent — layout', () => {
	it('renders the Back button', () => {
		renderWithProviders(<ReviewContent initial={baseData} />);
		expect(screen.getByRole('button', { name: /back/i })).toBeInTheDocument();
	});

	it('renders section labels', () => {
		renderWithProviders(<ReviewContent initial={baseData} />);
		expect(screen.getByText('Experience')).toBeInTheDocument();
		// "Projects · N extracted" or just "Projects"
		expect(screen.getAllByText(/projects/i).length).toBeGreaterThanOrEqual(1);
		// "Education" appears in section label and AiSidebar — just assert at least one
		expect(screen.getAllByText('Education').length).toBeGreaterThanOrEqual(1);
	});

	it('shows the skills count label when skills are present', () => {
		renderWithProviders(<ReviewContent initial={baseData} />);
		// 2 technical + 1 tool = 3 total
		expect(screen.getByText(/skills · 3 extracted/i)).toBeInTheDocument();
	});

	it('shows no extracted count in skills label when there are no skills', () => {
		renderWithProviders(<ReviewContent initial={emptySkillsData} />);
		// No "Skills · N extracted" label
		expect(
			screen.queryByText(/skills · \d+ extracted/i),
		).not.toBeInTheDocument();
	});

	it('renders the confirm button as "Looks good" when data is unchanged', () => {
		renderWithProviders(<ReviewContent initial={baseData} />);
		expect(
			screen.getByRole('button', { name: /looks good/i }),
		).toBeInTheDocument();
	});
});

describe('ReviewContent — navigation', () => {
	it('navigates to /skills when Back is clicked', async () => {
		const user = userEvent.setup();
		renderWithProviders(<ReviewContent initial={baseData} />);

		await user.click(screen.getByRole('button', { name: /back/i }));

		expect(mockNavigate).toHaveBeenCalledWith('/skills', { replace: true });
	});
});

describe('ReviewContent — confirm', () => {
	it('calls the verify mutation and navigates on confirm', async () => {
		const user = userEvent.setup();
		renderWithProviders(<ReviewContent initial={baseData} />);

		await user.click(screen.getByRole('button', { name: /looks good/i }));

		await waitFor(() => {
			expect(mockNavigate).toHaveBeenCalledWith('/skills', { replace: true });
		});
	});
});
