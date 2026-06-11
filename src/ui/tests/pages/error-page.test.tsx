import { screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('react-router', async (importOriginal) => {
	const actual = await importOriginal<typeof import('react-router')>();
	return {
		...actual,
		useRouteError: vi.fn(),
		isRouteErrorResponse: vi.fn(),
	};
});

const { default: ErrorPage } = await import('@/pages/ErrorPage');
const { useRouteError, isRouteErrorResponse } = await import('react-router');

describe('ErrorPage', () => {
	it('renders 404 message when error is a 404 route response', () => {
		vi.mocked(useRouteError).mockReturnValue({ status: 404 });
		vi.mocked(isRouteErrorResponse).mockReturnValue(true);

		render(
			<MemoryRouter>
				<ErrorPage />
			</MemoryRouter>,
		);

		expect(screen.getByText(/dead end/i)).toBeInTheDocument();
		expect(
			screen.getByRole('link', { name: /back to safety/i }),
		).toBeInTheDocument();
	});

	it('renders generic error message when error is not a 404', () => {
		vi.mocked(useRouteError).mockReturnValue(new Error('Something went wrong'));
		vi.mocked(isRouteErrorResponse).mockReturnValue(false);

		render(
			<MemoryRouter>
				<ErrorPage />
			</MemoryRouter>,
		);

		expect(screen.getByText(/something broke/i)).toBeInTheDocument();
	});
});
