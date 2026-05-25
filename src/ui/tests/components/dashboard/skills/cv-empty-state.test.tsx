import { describe, expect, it } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { CvEmptyState } from '@/components/dashboard/skills/cv-empty-state';

import { renderWithProviders } from '../../../helpers/render';

const validPdf = new File(['pdf-content'], 'resume.pdf', {
	type: 'application/pdf',
});
const largePdf = new File([new Uint8Array(3 * 1024 * 1024)], 'big.pdf', {
	type: 'application/pdf',
});
const nonPdf = new File(['text'], 'doc.txt', { type: 'text/plain' });

describe('CvEmptyState', () => {
	it('renders the upload prompt', () => {
		renderWithProviders(<CvEmptyState />);

		expect(screen.getByText(/upload your cv/i)).toBeInTheDocument();
		expect(screen.getByText('Upload CV')).toBeInTheDocument();
	});

	it('shows the file preview after a valid PDF is selected', async () => {
		const user = userEvent.setup();
		renderWithProviders(<CvEmptyState />);

		const input =
			document.querySelector<HTMLInputElement>('input[type="file"]')!;
		await user.upload(input, validPdf);

		await waitFor(() => {
			expect(screen.getByText('resume.pdf')).toBeInTheDocument();
			expect(screen.getByText(/ready to upload/i)).toBeInTheDocument();
		});
	});

	it('rejects a non-PDF file and keeps the empty state', async () => {
		const user = userEvent.setup();
		renderWithProviders(<CvEmptyState />);

		const input =
			document.querySelector<HTMLInputElement>('input[type="file"]')!;
		await user.upload(input, nonPdf);

		expect(screen.queryByText('doc.txt')).not.toBeInTheDocument();
		expect(screen.getByText(/upload your cv/i)).toBeInTheDocument();
	});

	it('rejects a file larger than 2 MB and keeps the empty state', async () => {
		const user = userEvent.setup();
		renderWithProviders(<CvEmptyState />);

		const input =
			document.querySelector<HTMLInputElement>('input[type="file"]')!;
		await user.upload(input, largePdf);

		expect(screen.queryByText('big.pdf')).not.toBeInTheDocument();
		expect(screen.getByText(/upload your cv/i)).toBeInTheDocument();
	});

	it('shows Upload CV and Change buttons in the preview state', async () => {
		const user = userEvent.setup();
		renderWithProviders(<CvEmptyState />);

		const input =
			document.querySelector<HTMLInputElement>('input[type="file"]')!;
		await user.upload(input, validPdf);

		await waitFor(() => screen.getByText('resume.pdf'));

		expect(
			screen.getByRole('button', { name: /upload cv/i }),
		).toBeInTheDocument();
		expect(screen.getByText('Change')).toBeInTheDocument();
	});

	it('calls the upload mutation and clears the preview on confirm', async () => {
		const user = userEvent.setup();
		renderWithProviders(<CvEmptyState />);

		const input =
			document.querySelector<HTMLInputElement>('input[type="file"]')!;
		await user.upload(input, validPdf);

		await waitFor(() => screen.getByText('resume.pdf'));
		await user.click(screen.getByRole('button', { name: /upload cv/i }));

		await waitFor(() => {
			expect(screen.queryByText('resume.pdf')).not.toBeInTheDocument();
		});
	});
});
