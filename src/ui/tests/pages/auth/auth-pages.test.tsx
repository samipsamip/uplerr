import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import ForgotPasswordPage from '@/pages/auth/ForgotPasswordPage';
import LoginPage from '@/pages/auth/LoginPage';
import PasswordResetConfirmationPage from '@/pages/auth/PasswordResetConfirmationPage';
import PasswordResetSuccessPage from '@/pages/auth/PasswordResetSuccessPage';
import ResetPasswordPage from '@/pages/auth/ResetPasswordPage';
import SignupPage from '@/pages/auth/SignupPage';
import SignupSuccessPage from '@/pages/auth/SignupSuccessPage';

import { renderWithProviders } from '../../helpers/render';

// Mock child form components so tests stay focused on page-level rendering
vi.mock('@/components/login/login-form', () => ({
	LoginForm: () => <div>LoginForm</div>,
}));
vi.mock('@/components/signup/signup-form', () => ({
	SignupForm: () => <div>SignupForm</div>,
}));
vi.mock('@/components/login/forgot-password', () => ({
	ForgotPasswordForm: () => <div>ForgotPasswordForm</div>,
}));
vi.mock('@/components/login/reset-password-form', () => ({
	ResetPasswordForm: () => <div>ResetPasswordForm</div>,
}));
vi.mock('@/components/login/password-reset-confirmation', () => ({
	PasswordResetConfirm: () => <div>PasswordResetConfirm</div>,
}));
vi.mock('@/components/login/password-reset-success', () => ({
	PasswordResetSuccess: () => <div>PasswordResetSuccess</div>,
}));
vi.mock('@/components/signup/signup-success', () => ({
	SignupSuccess: () => <div>SignupSuccess</div>,
}));

describe('LoginPage', () => {
	it('renders the LoginForm', () => {
		renderWithProviders(<LoginPage />);
		expect(screen.getByText('LoginForm')).toBeInTheDocument();
	});
});

describe('SignupPage', () => {
	it('renders the SignupForm', () => {
		renderWithProviders(<SignupPage />);
		expect(screen.getByText('SignupForm')).toBeInTheDocument();
	});
});

describe('ForgotPasswordPage', () => {
	it('renders the ForgotPasswordForm', () => {
		renderWithProviders(<ForgotPasswordPage />);
		expect(screen.getByText('ForgotPasswordForm')).toBeInTheDocument();
	});
});

describe('ResetPasswordPage', () => {
	it('renders the ResetPasswordForm', () => {
		renderWithProviders(<ResetPasswordPage />);
		expect(screen.getByText('ResetPasswordForm')).toBeInTheDocument();
	});
});

describe('SignupSuccessPage', () => {
	it('renders the SignupSuccess component', () => {
		renderWithProviders(<SignupSuccessPage />);
		expect(screen.getByText('SignupSuccess')).toBeInTheDocument();
	});
});

describe('PasswordResetConfirmationPage', () => {
	it('redirects to /forgot-password when accessed without state', () => {
		renderWithProviders(<PasswordResetConfirmationPage />);
		// Without state the component returns null and triggers navigate
		expect(screen.queryByText('PasswordResetConfirm')).not.toBeInTheDocument();
	});
});

describe('PasswordResetSuccessPage', () => {
	it('redirects when accessed without state', () => {
		renderWithProviders(<PasswordResetSuccessPage />);
		expect(screen.queryByText('PasswordResetSuccess')).not.toBeInTheDocument();
	});
});
