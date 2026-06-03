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

vi.mock('@/components/ui/sidebar', () => ({
	Sidebar: ({ children, ...props }: React.ComponentProps<'nav'>) => (
		<nav {...props}>{children}</nav>
	),
	SidebarHeader: ({ children }: { children: React.ReactNode }) => (
		<div data-testid="sidebar-header">{children}</div>
	),
	SidebarContent: ({ children }: { children: React.ReactNode }) => (
		<div data-testid="sidebar-content">{children}</div>
	),
	SidebarFooter: ({ children }: { children: React.ReactNode }) => (
		<div data-testid="sidebar-footer">{children}</div>
	),
	SidebarGroup: ({ children }: { children: React.ReactNode }) => (
		<div>{children}</div>
	),
	SidebarGroupContent: ({ children }: { children: React.ReactNode }) => (
		<div>{children}</div>
	),
	SidebarGroupLabel: () => null,
	SidebarMenu: ({
		children,
		className,
	}: {
		children: React.ReactNode;
		className?: string;
	}) => <ul className={className}>{children}</ul>,
	SidebarMenuItem: ({ children }: { children: React.ReactNode }) => (
		<li>{children}</li>
	),
	SidebarMenuButton: ({
		children,
		onClick,
		asChild,
		isActive,
		...props
	}: React.ComponentProps<'button'> & {
		asChild?: boolean;
		isActive?: boolean;
		tooltip?: string;
	}) => {
		if (asChild) {
			return (
				<div
					onClick={
						onClick as unknown as React.MouseEventHandler<HTMLDivElement>
					}
					{...(props as React.HTMLAttributes<HTMLDivElement>)}
				>
					{children}
				</div>
			);
		}
		return (
			<button onClick={onClick} data-active={isActive} {...props}>
				{children}
			</button>
		);
	},
	useSidebar: vi.fn(() => ({ isMobile: false, setOpenMobile: vi.fn() })),
}));

vi.mock('@/components/dashboard/user-navigation', () => ({
	NavUser: ({ user }: { user: { name: string; email: string } }) => (
		<div data-testid="nav-user">{user.name}</div>
	),
}));

const { default: AppSidebar } =
	await import('@/components/dashboard/app-sidebar');

describe('AppSidebar', () => {
	it('renders the app brand name', () => {
		renderWithProviders(<AppSidebar />);
		expect(screen.getByText('Uplerr')).toBeInTheDocument();
	});

	it('renders navigation items', () => {
		renderWithProviders(<AppSidebar />);
		expect(screen.getByText('Dashboard')).toBeInTheDocument();
		expect(screen.getByText('Roadmaps')).toBeInTheDocument();
		expect(screen.getByText('Skills & CV')).toBeInTheDocument();
	});

	it('renders the NavUser in the footer', () => {
		renderWithProviders(<AppSidebar />);
		expect(screen.getByTestId('nav-user')).toBeInTheDocument();
	});

	it('renders the tagline text', () => {
		renderWithProviders(<AppSidebar />);
		expect(screen.getByText(/learning/i)).toBeInTheDocument();
	});
});
