import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';

import { AuthFormShell } from '@/components/auth/auth-form-shell';

import { renderWithProviders } from '../../helpers/render';

describe('AuthFormShell', () => {
	it('renders the children inside the card', () => {
		renderWithProviders(
			<AuthFormShell imageSrc="/test.png" imageAlt="Test image">
				<p>Form content goes here</p>
			</AuthFormShell>,
		);

		expect(screen.getByText('Form content goes here')).toBeInTheDocument();
	});

	it('renders the side image with the correct alt text', () => {
		renderWithProviders(
			<AuthFormShell imageSrc="/test.png" imageAlt="Side panel image">
				<p>Child</p>
			</AuthFormShell>,
		);

		expect(screen.getByAltText('Side panel image')).toBeInTheDocument();
	});

	it('renders the image with the correct src', () => {
		renderWithProviders(
			<AuthFormShell imageSrc="/login.png" imageAlt="Login panel">
				<p>Child</p>
			</AuthFormShell>,
		);

		const img = screen.getByAltText('Login panel') as HTMLImageElement;
		expect(img.src).toContain('/login.png');
	});

	it('passes additional className to the wrapper', () => {
		const { container } = renderWithProviders(
			<AuthFormShell
				imageSrc="/test.png"
				imageAlt="alt"
				className="custom-class"
			>
				<p>Child</p>
			</AuthFormShell>,
		);

		expect(container.firstChild).toHaveClass('custom-class');
	});
});
