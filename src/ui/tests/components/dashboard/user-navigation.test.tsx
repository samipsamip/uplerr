import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { renderWithProviders } from '../../helpers/render';

vi.mock('@/components/ui/sidebar', () => ({
	SidebarMenu: ({ children }: { children: React.ReactNode }) => (
		<ul>{children}</ul>
	),
	SidebarMenuItem: ({ children }: { children: React.ReactNode }) => (
		<li>{children}</li>
	),
	SidebarMenuButton: ({
		children,
		...props
	}: React.ComponentProps<'button'>) => <button {...props}>{children}</button>,
	useSidebar: () => ({ isMobile: false }),
}));

vi.mock('@/auth-client', () => ({
	authClient: { signOut: vi.fn() },
}));

vi.mock('@/lib/routes', () => ({
	invalidateSessionCache: vi.fn(),
}));

const { NavUser } = await import('@/components/dashboard/user-navigation');

const mockUser = {
	name: 'Jane Doe',
	email: 'jane@example.com',
	avatar: undefined,
};

describe('NavUser', () => {
	it('renders the user name', () => {
		renderWithProviders(<NavUser user={mockUser} />);
		expect(screen.getAllByText('Jane Doe').length).toBeGreaterThan(0);
	});

	it('renders the user email', () => {
		renderWithProviders(<NavUser user={mockUser} />);
		expect(screen.getAllByText('jane@example.com').length).toBeGreaterThan(0);
	});

	it('renders initials as avatar fallback', () => {
		renderWithProviders(<NavUser user={mockUser} />);
		// getInitials('Jane Doe') = 'JD'
		expect(screen.getAllByText('JD').length).toBeGreaterThan(0);
	});

	it('renders with an avatar image when provided', () => {
		renderWithProviders(
			<NavUser
				user={{ ...mockUser, avatar: 'https://example.com/avatar.png' }}
			/>,
		);
		expect(screen.getAllByText('JD').length).toBeGreaterThan(0);
	});
});
