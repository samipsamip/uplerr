import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { renderWithProviders } from '../../helpers/render';

// Mock the heavy components so page wrappers are tested in isolation
vi.mock('@/components/dashboard/app-sidebar', () => ({
	default: () => <aside data-testid="app-sidebar">sidebar</aside>,
}));

vi.mock('@/components/ui/sidebar', () => ({
	SidebarProvider: ({ children }: { children: React.ReactNode }) => (
		<div data-testid="sidebar-provider">{children}</div>
	),
	SidebarTrigger: () => <button>trigger</button>,
	SidebarInset: ({ children }: { children: React.ReactNode }) => (
		<div>{children}</div>
	),
	useSidebar: () => ({ isMobile: false, setOpenMobile: vi.fn(), open: false }),
}));

vi.mock('@/components/ui/tooltip', () => ({
	TooltipProvider: ({ children }: { children: React.ReactNode }) => (
		<div>{children}</div>
	),
}));

vi.mock('@/components/dashboard/dashboard-main', () => ({
	default: () => <div data-testid="dashboard-main">dashboard main</div>,
}));

vi.mock('@/components/dashboard/roadmaps-main', () => ({
	default: () => <div data-testid="roadmaps-main">roadmaps</div>,
}));

vi.mock('@/components/dashboard/skills/skills-main', () => ({
	default: () => <div data-testid="skills-main">skills</div>,
}));

const [
	{ default: Layout },
	{ default: Dashboard },
	{ default: Roadmaps },
	{ default: Skills },
] = await Promise.all([
	import('@/pages/dashboard/Layout'),
	import('@/pages/dashboard/Dashboard'),
	import('@/pages/dashboard/Roadmaps'),
	import('@/pages/dashboard/Skills'),
]);

describe('Layout', () => {
	it('renders children inside the layout', () => {
		renderWithProviders(
			<Layout>
				<div data-testid="child">content</div>
			</Layout>,
		);
		expect(screen.getByTestId('child')).toBeInTheDocument();
		expect(screen.getByTestId('app-sidebar')).toBeInTheDocument();
	});
});

describe('Dashboard page', () => {
	it('renders the dashboard main component', () => {
		renderWithProviders(<Dashboard />);
		expect(screen.getByTestId('dashboard-main')).toBeInTheDocument();
	});
});

describe('Roadmaps page', () => {
	it('renders the roadmaps main component', () => {
		renderWithProviders(<Roadmaps />);
		expect(screen.getByTestId('roadmaps-main')).toBeInTheDocument();
	});
});

describe('Skills page', () => {
	it('renders the skills main component', () => {
		renderWithProviders(<Skills />);
		expect(screen.getByTestId('skills-main')).toBeInTheDocument();
	});
});
