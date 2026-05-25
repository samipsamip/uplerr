import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { authClient } from '@/auth-client';
import { LoginForm } from '@/components/login/login-form';

import { renderWithProviders } from '../../helpers/render';

const mockNavigate = vi.fn();

vi.mock('react-router', async (importOriginal) => {
	const actual = await importOriginal<typeof import('react-router')>();
	return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock('@/auth-client', () => ({
	authClient: {
		signIn: { email: vi.fn() },
	},
}));

beforeEach(() => vi.clearAllMocks());

describe('LoginForm', () => {
	it('renders email and password fields with a login button', () => {
		renderWithProviders(<LoginForm />);

		expect(screen.getByLabelText('Email')).toBeInTheDocument();
		expect(screen.getByLabelText('Password')).toBeInTheDocument();
		expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
	});

	it('login button is disabled before the form is touched', () => {
		renderWithProviders(<LoginForm />);

		expect(screen.getByRole('button', { name: /login/i })).toBeDisabled();
	});

	it('renders a "Forgot your password?" link', () => {
		renderWithProviders(<LoginForm />);

		expect(
			screen.getByRole('link', { name: /forgot your password/i }),
		).toBeInTheDocument();
	});

	it('renders a sign up link', () => {
		renderWithProviders(<LoginForm />);

		expect(screen.getByRole('link', { name: /sign up/i })).toBeInTheDocument();
	});

	it('shows a validation error for an invalid email', async () => {
		const user = userEvent.setup();
		renderWithProviders(<LoginForm />);

		await user.type(screen.getByLabelText('Email'), 'not-an-email');
		await user.type(screen.getByLabelText('Password'), 'password123');
		fireEvent.submit(document.querySelector('form')!);

		await waitFor(() => {
			expect(screen.getByText(/invalid email/i)).toBeInTheDocument();
		});
	});

	it('calls authClient.signIn.email with entered credentials on valid submit', async () => {
		const user = userEvent.setup();
		vi.mocked(authClient.signIn.email).mockResolvedValue(undefined as never);
		renderWithProviders(<LoginForm />);

		await user.type(screen.getByLabelText('Email'), 'test@example.com');
		await user.type(screen.getByLabelText('Password'), 'secret123');
		await user.click(screen.getByRole('button', { name: /login/i }));

		await waitFor(() => {
			expect(authClient.signIn.email).toHaveBeenCalledWith(
				expect.objectContaining({
					email: 'test@example.com',
					password: 'secret123',
				}),
				expect.any(Object),
			);
		});
	});

	it('navigates to /dashboard after successful login', async () => {
		const user = userEvent.setup();
		vi.mocked(authClient.signIn.email).mockImplementation(
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			async (_data: unknown, callbacks: any) => {
				callbacks?.onSuccess?.();
				return undefined as never;
			},
		);
		renderWithProviders(<LoginForm />);

		await user.type(screen.getByLabelText('Email'), 'test@example.com');
		await user.type(screen.getByLabelText('Password'), 'secret123');
		await user.click(screen.getByRole('button', { name: /login/i }));

		await waitFor(() => {
			expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
		});
	});
});
