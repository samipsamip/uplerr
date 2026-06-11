import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { renderWithProviders } from '../../helpers/render';

vi.mock('@/components/dashboard/top-bar', () => ({
	TopBar: ({
		title,
		description,
		action,
	}: {
		title: string;
		description?: string;
		action?: React.ReactNode;
	}) => (
		<header>
			<h1>{title}</h1>
			{description && <p>{description}</p>}
			{action}
		</header>
	),
}));

vi.mock('@/components/dashboard/app-sidebar', () => ({
	default: () => <aside data-testid="app-sidebar" />,
}));

vi.mock('@/components/ui/sidebar', () => ({
	SidebarProvider: ({ children }: { children: React.ReactNode }) => (
		<div>{children}</div>
	),
	SidebarTrigger: () => <button>trigger</button>,
	SidebarInset: ({ children }: { children: React.ReactNode }) => (
		<div>{children}</div>
	),
	useSidebar: () => ({ isMobile: false }),
}));

vi.mock('@/components/ui/tooltip', () => ({
	TooltipProvider: ({ children }: { children: React.ReactNode }) => (
		<div>{children}</div>
	),
}));

vi.mock('react-router', async () => {
	const actual = await vi.importActual('react-router');
	return {
		...actual,
		useParams: () => ({ planId: 'plan-123' }),
		useNavigate: () => vi.fn(),
		Navigate: ({ to }: { to: string }) => (
			<div data-testid="navigate" data-to={to} />
		),
	};
});

vi.mock('@/query/roadmaps.query', () => ({
	useGetRoadmap: () => ({
		data: {
			id: 'plan-123',
			job_title: 'Senior Engineer',
			company: 'Acme Corp',
			status: 'active',
			estimated_weeks: 6,
			topic_count: 2,
			subtopic_count: 4,
			created_at: new Date().toISOString(),
			roadmap: {
				summary: 'A test roadmap summary.',
				estimated_weeks: 6,
				topics: [
					{
						order: 1,
						title: 'Topic One',
						subtopics: [
							{
								title: 'Subtopic A',
								why: 'Reason A',
								search_queries: ['query 1'],
							},
						],
					},
				],
			},
		},
		isLoading: false,
		isError: false,
	}),
	useDeleteRoadmap: () => ({ mutate: vi.fn(), isPending: false }),
	useUpdateRoadmapStatus: () => ({ mutate: vi.fn(), isPending: false }),
	useAddSubtopicResource: () => ({ mutate: vi.fn(), isPending: false }),
}));

const { default: RoadmapView } = await import('@/pages/dashboard/RoadmapView');

describe('RoadmapView', () => {
	it('renders the job title in the top bar', () => {
		renderWithProviders(<RoadmapView />);
		expect(screen.getByText('Senior Engineer')).toBeInTheDocument();
	});

	it('renders the company name', () => {
		renderWithProviders(<RoadmapView />);
		expect(screen.getByText('Acme Corp')).toBeInTheDocument();
	});

	it('renders the roadmap summary', () => {
		renderWithProviders(<RoadmapView />);
		expect(screen.getByText('A test roadmap summary.')).toBeInTheDocument();
	});

	it('renders topic titles', () => {
		renderWithProviders(<RoadmapView />);
		expect(screen.getByText('Topic One')).toBeInTheDocument();
	});

	it('renders the delete button', () => {
		renderWithProviders(<RoadmapView />);
		expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument();
	});
});
