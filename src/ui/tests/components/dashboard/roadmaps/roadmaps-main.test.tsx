import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';

import RoadmapsMain from '@/components/dashboard/roadmaps-main';

import { renderWithProviders } from '../../../helpers/render';

vi.mock('@/components/dashboard/top-bar', () => ({
	TopBar: ({ title, action }: { title: string; action?: React.ReactNode }) => (
		<header>
			<h1>{title}</h1>
			{action}
		</header>
	),
}));

describe('RoadmapsMain', () => {
	it('renders the page title', () => {
		renderWithProviders(<RoadmapsMain />);
		expect(screen.getByText('Roadmaps')).toBeInTheDocument();
	});

	it('renders the search input', () => {
		renderWithProviders(<RoadmapsMain />);
		expect(screen.getByPlaceholderText(/search roadmaps/i)).toBeInTheDocument();
	});

	it('renders the three status filter pills', () => {
		renderWithProviders(<RoadmapsMain />);
		expect(screen.getByRole('button', { name: /active/i })).toBeInTheDocument();
		expect(
			screen.getByRole('button', { name: /completed/i }),
		).toBeInTheDocument();
		expect(screen.getByRole('button', { name: /paused/i })).toBeInTheDocument();
	});

	it('renders roadmap cards', () => {
		renderWithProviders(<RoadmapsMain />);
		// Static placeholder data has at least one card
		expect(screen.getAllByRole('heading', { level: 3 }).length).toBeGreaterThan(
			0,
		);
	});

	it('renders company names in cards', () => {
		renderWithProviders(<RoadmapsMain />);
		expect(screen.getAllByText('Stripe').length).toBeGreaterThan(0);
	});

	it('renders progress percentages', () => {
		renderWithProviders(<RoadmapsMain />);
		// At least one card shows a %
		expect(screen.getAllByText(/%$/).length).toBeGreaterThan(0);
	});

	it('renders a New Roadmap button', () => {
		renderWithProviders(<RoadmapsMain />);
		expect(
			screen.getByRole('button', { name: /new roadmap/i }),
		).toBeInTheDocument();
	});
});
