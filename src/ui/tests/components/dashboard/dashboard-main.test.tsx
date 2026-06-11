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
		expect(screen.getByText(/Test/)).toBeInTheDocument();
	});

	it('renders all four stat card labels', () => {
		renderWithProviders(<DashboardMain />);
		expect(screen.getAllByText('Active Roadmaps').length).toBeGreaterThan(0);
		expect(screen.getByText('Completed')).toBeInTheDocument();
		expect(screen.getByText('Skills in Profile')).toBeInTheDocument();
		expect(screen.getByText('Skills to Develop')).toBeInTheDocument();
	});

	it('renders the onboarding section when no data', () => {
		renderWithProviders(<DashboardMain />);
		expect(screen.getByText('Get started with Uplerr')).toBeInTheDocument();
	});

	it('renders a New Roadmap action button', () => {
		renderWithProviders(<DashboardMain />);
		expect(
			screen.getByRole('link', { name: /new roadmap/i }),
		).toBeInTheDocument();
	});
});
