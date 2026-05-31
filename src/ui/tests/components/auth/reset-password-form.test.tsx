import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { authClient } from '@/auth-client';
import { ResetPasswordForm } from '@/components/login/reset-password-form';

import { renderWithProviders } from '../../helpers/render';

const mockNavigate = vi.fn();

vi.mock('react-router', async (importOriginal) => {
	const actual = await importOriginal<typeof import('react-router')>();
	return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock('@/auth-client', () => ({
	authClient: {
		resetPassword: vi.fn(),
	},
}));

beforeEach(() => {
	vi.clearAllMocks();
	// Restore a valid token by default
	Object.defineProperty(window, 'location', {
		value: { search: '?token=valid-token-abc' },
		writable: true,
	});
});

describe('ResetPasswordForm — invalid token state', () => {
	it('shows an invalid link message when no token is present', () => {
		Object.defineProperty(window, 'location', {
			value: { search: '' },
			writable: true,
		});
		renderWithProviders(<ResetPasswordForm />);

		expect(screen.getByText(/invalid reset link/i)).toBeInTheDocument();
		expect(
			screen.getByRole('link', { name: /go back to home/i }),
		).toBeInTheDocument();
	});

	it('shows an invalid link message when errorToken is present', () => {
		Object.defineProperty(window, 'location', {
			value: { search: '?error=invalid_token' },
			writable: true,
		});
		renderWithProviders(<ResetPasswordForm />);

		expect(screen.getByText(/invalid reset link/i)).toBeInTheDocument();
	});
});

describe('ResetPasswordForm — valid token', () => {
	it('renders password and confirm password fields', () => {
		renderWithProviders(<ResetPasswordForm />);

		expect(screen.getByLabelText('New password')).toBeInTheDocument();
		expect(screen.getByLabelText('Confirm new password')).toBeInTheDocument();
		expect(
			screen.getByRole('button', { name: /reset password/i }),
		).toBeInTheDocument();
	});

	it('shows validation errors when passwords do not match', async () => {
		const user = userEvent.setup();
		renderWithProviders(<ResetPasswordForm />);

		await user.type(screen.getByLabelText('New password'), 'newpassword123');
		await user.type(
			screen.getByLabelText('Confirm new password'),
			'different123',
		);
		await user.click(screen.getByRole('button', { name: /reset password/i }));

		await waitFor(() => {
			expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
		});
	});

	it('shows a validation error when password is too short', async () => {
		const user = userEvent.setup();
		renderWithProviders(<ResetPasswordForm />);

		await user.type(screen.getByLabelText('New password'), 'short');
		await user.type(screen.getByLabelText('Confirm new password'), 'short');
		await user.click(screen.getByRole('button', { name: /reset password/i }));

		await waitFor(() => {
			// Both fields show "at least 8 characters" — assert at least one exists
			expect(
				screen.getAllByText(/at least 8 characters/i).length,
			).toBeGreaterThanOrEqual(1);
		});
	});

	it('calls authClient.resetPassword with the new password and token', async () => {
		const user = userEvent.setup();
		vi.mocked(authClient.resetPassword).mockImplementation(
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			(_data, _callbacks) => Promise.resolve(undefined as never),
		);
		renderWithProviders(<ResetPasswordForm />);

		await user.type(screen.getByLabelText('New password'), 'newpassword123');
		await user.type(
			screen.getByLabelText('Confirm new password'),
			'newpassword123',
		);
		await user.click(screen.getByRole('button', { name: /reset password/i }));

		await waitFor(() => {
			expect(authClient.resetPassword).toHaveBeenCalledWith(
				expect.objectContaining({
					newPassword: 'newpassword123',
					token: 'valid-token-abc',
				}),
				expect.any(Object),
			);
		});
	});

	it('navigates to / on successful reset', async () => {
		const user = userEvent.setup();
		vi.mocked(authClient.resetPassword).mockImplementation(
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			(_data, callbacks: any) => {
				callbacks?.onSuccess?.();
				return Promise.resolve(undefined as never);
			},
		);
		renderWithProviders(<ResetPasswordForm />);

		await user.type(screen.getByLabelText('New password'), 'newpassword123');
		await user.type(
			screen.getByLabelText('Confirm new password'),
			'newpassword123',
		);
		await user.click(screen.getByRole('button', { name: /reset password/i }));

		await waitFor(() => {
			expect(mockNavigate).toHaveBeenCalledWith('/');
		});
	});
});
