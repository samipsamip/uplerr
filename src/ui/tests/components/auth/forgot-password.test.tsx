import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { authClient } from '@/auth-client';
import { ForgotPasswordForm } from '@/components/login/forgot-password';

import { renderWithProviders } from '../../helpers/render';

const mockNavigate = vi.fn();

vi.mock('react-router', async (importOriginal) => {
	const actual = await importOriginal<typeof import('react-router')>();
	return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock('@/auth-client', () => ({
	authClient: {
		requestPasswordReset: vi.fn(),
	},
}));

beforeEach(() => vi.clearAllMocks());

describe('ForgotPasswordForm', () => {
	it('renders the email field and submit button', () => {
		renderWithProviders(<ForgotPasswordForm />);

		expect(screen.getByLabelText('Email')).toBeInTheDocument();
		expect(
			screen.getByRole('button', { name: /send reset link/i }),
		).toBeInTheDocument();
	});

	it('renders a link back to login', () => {
		renderWithProviders(<ForgotPasswordForm />);

		expect(
			screen.getByRole('link', { name: /back to login/i }),
		).toBeInTheDocument();
	});

	it('shows a validation error for an invalid email', async () => {
		const user = userEvent.setup();
		renderWithProviders(<ForgotPasswordForm />);

		await user.type(screen.getByLabelText('Email'), 'not-an-email');
		fireEvent.submit(document.querySelector('form')!);

		await waitFor(() => {
			// Zod v4 email validation error
			expect(document.querySelector('p.text-destructive')).toBeInTheDocument();
		});
		expect(authClient.requestPasswordReset).not.toHaveBeenCalled();
	});

	it('calls authClient.requestPasswordReset on valid submit', async () => {
		const user = userEvent.setup();
		vi.mocked(authClient.requestPasswordReset).mockImplementation(
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			(_data, _callbacks) => Promise.resolve(undefined as never),
		);
		renderWithProviders(<ForgotPasswordForm />);

		await user.type(screen.getByLabelText('Email'), 'user@example.com');
		await user.click(screen.getByRole('button', { name: /send reset link/i }));

		await waitFor(() => {
			expect(authClient.requestPasswordReset).toHaveBeenCalledWith(
				expect.objectContaining({ email: 'user@example.com' }),
				expect.any(Object),
			);
		});
	});

	it('navigates to /forgot-password/confirmation on success', async () => {
		const user = userEvent.setup();
		vi.mocked(authClient.requestPasswordReset).mockImplementation(
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			(_data, callbacks: any) => {
				callbacks?.onSuccess?.();
				return Promise.resolve(undefined as never);
			},
		);
		renderWithProviders(<ForgotPasswordForm />);

		await user.type(screen.getByLabelText('Email'), 'user@example.com');
		await user.click(screen.getByRole('button', { name: /send reset link/i }));

		await waitFor(() => {
			expect(mockNavigate).toHaveBeenCalledWith(
				'/forgot-password/confirmation',
				expect.objectContaining({ state: { fromForgotPassword: true } }),
			);
		});
	});

	it('disables the submit button after successful submission', async () => {
		const user = userEvent.setup();
		vi.mocked(authClient.requestPasswordReset).mockImplementation(
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			(_data, callbacks: any) => {
				callbacks?.onSuccess?.();
				return Promise.resolve(undefined as never);
			},
		);
		renderWithProviders(<ForgotPasswordForm />);

		await user.type(screen.getByLabelText('Email'), 'user@example.com');
		await user.click(screen.getByRole('button', { name: /send reset link/i }));

		await waitFor(() => {
			expect(
				screen.getByRole('button', { name: /send reset link/i }),
			).toBeDisabled();
		});
	});
});
