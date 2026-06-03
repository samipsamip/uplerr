import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { renderWithProviders } from '../../helpers/render';

vi.mock('@/hooks/use-auth-user', () => ({
	default: vi.fn(() => ({
		name: 'Test User',
		email: 'test@example.com',
		image: null,
	})),
}));

vi.mock('@/components/dashboard/top-bar', () => ({
	TopBar: ({ title, action }: { title: string; action?: React.ReactNode }) => (
		<header>
			<h1>{title}</h1>
			{action}
		</header>
	),
}));

const { default: DashboardMain } =
	await import('@/components/dashboard/dashboard-main');

describe('DashboardMain', () => {
	it('renders a greeting with the user first name', () => {
		renderWithProviders(<DashboardMain />);
		// getFirstName('Test User') = 'Test', greeting = 'Good {morning|afternoon|evening}'
		expect(screen.getByText(/Test/)).toBeInTheDocument();
	});

	it('renders stat card labels', () => {
		renderWithProviders(<DashboardMain />);
		// The stat label appears in the card body (not in the section heading)
		expect(screen.getAllByText('Active Roadmaps').length).toBeGreaterThan(0);
		expect(screen.getByText('Avg. Progress')).toBeInTheDocument();
		expect(screen.getByText('Skills Gap')).toBeInTheDocument();
	});

	it('renders the onboarding section', () => {
		renderWithProviders(<DashboardMain />);
		expect(screen.getByText('Get started with Uplerr')).toBeInTheDocument();
	});

	it('renders the roadmap cards', () => {
		renderWithProviders(<DashboardMain />);
		expect(screen.getByText('Senior Frontend Engineer')).toBeInTheDocument();
		expect(screen.getByText('Full Stack Developer')).toBeInTheDocument();
	});

	it('renders a New Roadmap action button', () => {
		renderWithProviders(<DashboardMain />);
		expect(
			screen.getByRole('link', { name: /new roadmap/i }),
		).toBeInTheDocument();
	});
});
