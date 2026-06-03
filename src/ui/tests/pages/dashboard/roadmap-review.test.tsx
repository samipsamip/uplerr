import { screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/pages/dashboard/Layout', () => ({
	default: ({ children }: { children: React.ReactNode }) => (
		<div data-testid="layout">{children}</div>
	),
}));

const { default: RoadmapReview } =
	await import('@/pages/dashboard/RoadmapReview');

describe('RoadmapReview', () => {
	it('redirects to /roadmaps when no content state is provided', () => {
		render(
			<MemoryRouter initialEntries={['/roadmaps/review']}>
				<RoadmapReview />
			</MemoryRouter>,
		);
		expect(
			screen.queryByText('Job Description Review'),
		).not.toBeInTheDocument();
	});

	it('renders review content when content state is present', () => {
		render(
			<MemoryRouter
				initialEntries={[
					{
						pathname: '/roadmaps/review',
						state: { content: 'Senior Engineer at ACME Corp' },
					},
				]}
			>
				<RoadmapReview />
			</MemoryRouter>,
		);

		expect(screen.getByText('Job Description Review')).toBeInTheDocument();
		expect(
			screen.getByText('Senior Engineer at ACME Corp'),
		).toBeInTheDocument();
	});

	it('shows the review helper text', () => {
		render(
			<MemoryRouter
				initialEntries={[
					{
						pathname: '/roadmaps/review',
						state: { content: 'Job content here' },
					},
				]}
			>
				<RoadmapReview />
			</MemoryRouter>,
		);

		expect(
			screen.getByText(/before we generate your roadmap/i),
		).toBeInTheDocument();
	});
});
