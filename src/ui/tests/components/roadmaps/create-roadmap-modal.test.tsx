import { screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { http, HttpResponse } from 'msw';

import CreateRoadMapModal from '@/components/roadmaps/create-roadmap-modal';

import { renderWithProviders } from '../../helpers/render';
import { BASE } from '../../msw/handlers';
import { server } from '../../msw/server';

const mockNavigate = vi.fn();
vi.mock('react-router', async (importOriginal) => {
	const actual = await importOriginal<typeof import('react-router')>();
	return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

const renderModal = (open = true) =>
	renderWithProviders(<CreateRoadMapModal open={open} setOpen={vi.fn()} />);

describe('CreateRoadMapModal', () => {
	it('renders the modal title when open', () => {
		renderModal();
		expect(
			screen.getByText('Generate Your Learning Roadmap'),
		).toBeInTheDocument();
	});

	it('renders both tab triggers', () => {
		renderModal();
		expect(
			screen.getByRole('tab', { name: /use raw text/i }),
		).toBeInTheDocument();
		expect(screen.getByRole('tab', { name: /use url/i })).toBeInTheDocument();
	});

	it('renders the submit button', () => {
		renderModal();
		expect(
			screen.getByRole('button', { name: /analyse job/i }),
		).toBeInTheDocument();
	});

	it('shows URL input by default (url tab active)', () => {
		renderModal();
		expect(screen.getByPlaceholderText('https://...')).toBeInTheDocument();
	});

	it('switches to text input when Raw Text tab is clicked', async () => {
		const user = userEvent.setup();
		renderModal();
		// Radix Dialog sets pointer-events:none on <body> during scroll-lock.
		// Reset it so userEvent.click reaches the Radix Tab trigger.
		document.body.style.pointerEvents = '';
		await user.click(screen.getByRole('tab', { name: /use raw text/i }));
		expect(
			await screen.findByPlaceholderText(/paste job description here/i),
		).toBeInTheDocument();
	});

	it('does not render when open is false', () => {
		renderModal(false);
		expect(
			screen.queryByText('Generate Your Learning Roadmap'),
		).not.toBeInTheDocument();
	});

	it('shows a URL validation error when submitting the URL tab with an empty URL', async () => {
		renderModal();
		// Submit without filling in the URL field
		fireEvent.click(screen.getByRole('button', { name: /analyse job/i }));
		expect(
			await screen.findByText(/please enter a job url/i),
		).toBeInTheDocument();
	});

	it('shows a text validation error when submitting the text tab with empty text', async () => {
		renderModal();
		document.body.style.pointerEvents = '';
		const user = userEvent.setup();
		await user.click(screen.getByRole('tab', { name: /use raw text/i }));
		// Submit without filling in the raw text field
		fireEvent.click(screen.getByRole('button', { name: /analyse job/i }));
		expect(
			await screen.findByText(/please paste a job description/i),
		).toBeInTheDocument();
	});

	it('shows loading text once scrape is initiated', async () => {
		server.use(
			http.post(`${BASE}/api/scraper/scrape`, async () => {
				await new Promise(() => {}); // hang — simulates in-flight request
				return HttpResponse.json({ jobId: 'job-123' });
			}),
		);

		renderModal();

		const input = screen.getByPlaceholderText('https://...');
		fireEvent.change(input, { target: { value: 'https://example.com/job' } });
		fireEvent.click(screen.getByRole('button', { name: /analyse job/i }));

		await waitFor(() => {
			expect(screen.getAllByText(/getting ready/i).length).toBeGreaterThan(0);
		});
	});
});
