import { screen } from '@testing-library/react';
import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/components/ui/sidebar', () => ({
	SidebarTrigger: () => <button aria-label="Toggle sidebar">☰</button>,
	useSidebar: () => ({ isMobile: false, setOpenMobile: vi.fn(), open: false }),
}));

vi.mock('@/components/ui/separator', () => ({
	Separator: () => <hr />,
}));

const { TopBar } = await import('@/components/dashboard/top-bar');

describe('TopBar', () => {
	it('renders the title', () => {
		render(<TopBar title="My Dashboard" />);
		expect(screen.getByText('My Dashboard')).toBeInTheDocument();
	});

	it('renders description when provided', () => {
		render(<TopBar title="Skills" description="Manage your skills" />);
		expect(screen.getByText('Manage your skills')).toBeInTheDocument();
	});

	it('renders action slot when provided', () => {
		render(<TopBar title="Roadmaps" action={<button>New Roadmap</button>} />);
		expect(
			screen.getByRole('button', { name: 'New Roadmap' }),
		).toBeInTheDocument();
	});

	it('does not render description when not provided', () => {
		render(<TopBar title="Dashboard" />);
		expect(screen.queryByText(/description/i)).not.toBeInTheDocument();
	});
});
