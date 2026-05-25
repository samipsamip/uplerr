import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { authClient } from '@/auth-client';
import { SignupForm } from '@/components/signup/signup-form';

import { renderWithProviders } from '../../helpers/render';

const mockNavigate = vi.fn();

vi.mock('react-router', async (importOriginal) => {
	const actual = await importOriginal<typeof import('react-router')>();
	return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock('@/auth-client', () => ({
	authClient: {
		signUp: { email: vi.fn() },
	},
}));

beforeEach(() => vi.clearAllMocks());

async function fillSignupForm(
	user: ReturnType<typeof userEvent.setup>,
	overrides: { confirmPassword?: string } = {},
) {
	await user.type(screen.getByLabelText('First name'), 'Jane');
	await user.type(screen.getByLabelText('Last name'), 'Doe');
	await user.type(screen.getByLabelText('Email'), 'jane@example.com');
	await user.type(screen.getByLabelText('Password'), 'password123');
	await user.type(
		screen.getByLabelText('Confirm password'),
		overrides.confirmPassword ?? 'password123',
	);
}

describe('SignupForm', () => {
	it('renders all signup fields and a submit button', () => {
		renderWithProviders(<SignupForm />);

		expect(screen.getByLabelText('First name')).toBeInTheDocument();
		expect(screen.getByLabelText('Last name')).toBeInTheDocument();
		expect(screen.getByLabelText('Email')).toBeInTheDocument();
		expect(screen.getByLabelText('Password')).toBeInTheDocument();
		expect(screen.getByLabelText('Confirm password')).toBeInTheDocument();
		expect(
			screen.getByRole('button', { name: /create account/i }),
		).toBeInTheDocument();
	});

	it('shows an error when first name is missing', async () => {
		const user = userEvent.setup();
		renderWithProviders(<SignupForm />);

		await user.click(screen.getByRole('button', { name: /create account/i }));

		await waitFor(() => {
			expect(screen.getByText(/first name is required/i)).toBeInTheDocument();
		});
	});

	it('shows an error when passwords do not match', async () => {
		const user = userEvent.setup();
		renderWithProviders(<SignupForm />);

		await fillSignupForm(user, { confirmPassword: 'different123' });
		await user.click(screen.getByRole('button', { name: /create account/i }));

		await waitFor(() => {
			expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
		});
	});

	it('shows an error when password is too short', async () => {
		const user = userEvent.setup();
		renderWithProviders(<SignupForm />);

		await user.type(screen.getByLabelText('First name'), 'Jane');
		await user.type(screen.getByLabelText('Last name'), 'Doe');
		await user.type(screen.getByLabelText('Email'), 'jane@example.com');
		await user.type(screen.getByLabelText('Password'), 'short');
		await user.click(screen.getByRole('button', { name: /create account/i }));

		await waitFor(() => {
			expect(
				screen.getByText(/^Password must be at least 8 characters long$/i),
			).toBeInTheDocument();
		});
	});

	it('calls authClient.signUp.email with correct data on valid submit', async () => {
		const user = userEvent.setup();
		vi.mocked(authClient.signUp.email).mockResolvedValue(undefined as never);
		renderWithProviders(<SignupForm />);

		await fillSignupForm(user);
		await user.click(screen.getByRole('button', { name: /create account/i }));

		await waitFor(() => {
			expect(authClient.signUp.email).toHaveBeenCalledWith(
				expect.objectContaining({
					name: 'Jane Doe',
					email: 'jane@example.com',
					password: 'password123',
				}),
				expect.any(Object),
			);
		});
	});

	it('navigates to /signup/success with state after successful signup', async () => {
		const user = userEvent.setup();
		vi.mocked(authClient.signUp.email).mockImplementation(
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			async (_data: unknown, callbacks: any) => {
				callbacks?.onSuccess?.();
				return undefined as never;
			},
		);
		renderWithProviders(<SignupForm />);

		await fillSignupForm(user);
		await user.click(screen.getByRole('button', { name: /create account/i }));

		await waitFor(() => {
			expect(mockNavigate).toHaveBeenCalledWith('/signup/success', {
				state: { fromSignup: true },
			});
		});
	});
});
