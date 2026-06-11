import { screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';

import { SignupSuccess } from '@/components/signup/signup-success';

describe('SignupSuccess', () => {
	it('renders nothing and redirects when accessed without fromSignup state', () => {
		render(
			<MemoryRouter initialEntries={[{ pathname: '/signup/success' }]}>
				<SignupSuccess />
			</MemoryRouter>,
		);
		expect(screen.queryByText(/almost in/i)).not.toBeInTheDocument();
	});

	it('renders the success content when fromSignup state is present', () => {
		render(
			<MemoryRouter
				initialEntries={[
					{ pathname: '/signup/success', state: { fromSignup: true } },
				]}
			>
				<SignupSuccess />
			</MemoryRouter>,
		);

		expect(screen.getByText(/almost in/i)).toBeInTheDocument();
		expect(screen.getByText(/verification link/i)).toBeInTheDocument();
	});

	it('shows a link to try signing up again', () => {
		render(
			<MemoryRouter
				initialEntries={[
					{ pathname: '/signup/success', state: { fromSignup: true } },
				]}
			>
				<SignupSuccess />
			</MemoryRouter>,
		);

		expect(
			screen.getByRole('link', { name: /try again/i }),
		).toBeInTheDocument();
	});
});
