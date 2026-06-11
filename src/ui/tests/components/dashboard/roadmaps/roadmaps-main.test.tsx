import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';

import { renderWithProviders } from '../../../helpers/render';

vi.mock('@/components/dashboard/top-bar', () => ({
	TopBar: ({ title, action }: { title: string; action?: React.ReactNode }) => (
		<header>
			<h1>{title}</h1>
			{action}
		</header>
	),
}));

vi.mock('@/components/roadmaps/create-roadmap-modal', () => ({
	default: () => null,
}));

vi.mock('@/query/roadmaps.query', () => ({
	useGetRoadmaps: () => ({ data: [], isLoading: false }),
	useDeleteRoadmap: () => ({ mutate: vi.fn(), isPending: false }),
	useUpdateRoadmapStatus: () => ({ mutate: vi.fn(), isPending: false }),
}));

vi.mock('@/query/profile.query', () => ({
	useGetUserProfile: () => ({
		data: { cv: { hasStructuredData: true } },
		isLoading: false,
	}),
}));

const { default: RoadmapsMain } =
	await import('@/components/dashboard/roadmaps-main');

describe('RoadmapsMain', () => {
	it('renders the page title', () => {
		renderWithProviders(<RoadmapsMain />);
		expect(screen.getByText('Roadmaps')).toBeInTheDocument();
	});

	it('renders New Roadmap buttons when user has CV', () => {
		renderWithProviders(<RoadmapsMain />);
		expect(
			screen.getAllByRole('button', { name: /new roadmap/i }).length,
		).toBeGreaterThan(0);
	});

	it('shows empty state when no roadmaps exist', () => {
		renderWithProviders(<RoadmapsMain />);
		expect(screen.getByText(/no roadmaps yet/i)).toBeInTheDocument();
	});
});
