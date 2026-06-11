import { renderHook } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';

const mockUser = vi.hoisted(() => ({
	id: 'user-1',
	email: 'test@example.com',
	name: 'Test User',
	emailVerified: true,
	createdAt: '2024-01-01',
	updatedAt: '2024-01-01',
	image: null,
}));

vi.mock('react-router', async (importOriginal) => {
	const actual = await importOriginal<typeof import('react-router')>();
	return {
		...actual,
		useOutletContext: vi.fn().mockReturnValue(mockUser),
	};
});

const { default: useAuthUser } = await import('@/hooks/use-auth-user');

describe('useAuthUser', () => {
	it('returns the outlet context value', () => {
		const { result } = renderHook(() => useAuthUser(), {
			wrapper: ({ children }) => <MemoryRouter>{children}</MemoryRouter>,
		});

		expect(result.current).toEqual(mockUser);
	});

	it('exposes the user email', () => {
		const { result } = renderHook(() => useAuthUser(), {
			wrapper: ({ children }) => <MemoryRouter>{children}</MemoryRouter>,
		});
		expect(result.current.email).toBe('test@example.com');
	});
});
