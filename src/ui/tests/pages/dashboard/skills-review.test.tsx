import { screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/pages/dashboard/Layout', () => ({
	default: ({ children }: { children: React.ReactNode }) => (
		<div data-testid="layout">{children}</div>
	),
}));

vi.mock('@/components/dashboard/resume-review/review-content', () => ({
	ReviewContent: () => <div data-testid="review-content">review</div>,
}));

const { default: SkillsReview } =
	await import('@/pages/dashboard/SkillsReview');

const mockStructuredData = {
	extraction: {
		full_name: 'Test User',
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
	projects: { projects: [] },
};

describe('SkillsReview', () => {
	it('redirects to /skills when no structuredData is in state', () => {
		render(
			<MemoryRouter initialEntries={['/skills/review']}>
				<SkillsReview />
			</MemoryRouter>,
		);
		expect(screen.queryByTestId('review-content')).not.toBeInTheDocument();
	});

	it('renders ReviewContent when structuredData is provided in state', () => {
		render(
			<MemoryRouter
				initialEntries={[
					{
						pathname: '/skills/review',
						state: { structuredData: mockStructuredData },
					},
				]}
			>
				<SkillsReview />
			</MemoryRouter>,
		);

		expect(screen.getByTestId('review-content')).toBeInTheDocument();
	});

	it('renders within the layout when state is provided', () => {
		render(
			<MemoryRouter
				initialEntries={[
					{
						pathname: '/skills/review',
						state: {
							structuredData: mockStructuredData,
							skillMatchMeta: { matched: 5, total: 10 },
						},
					},
				]}
			>
				<SkillsReview />
			</MemoryRouter>,
		);

		expect(screen.getByTestId('layout')).toBeInTheDocument();
	});
});
