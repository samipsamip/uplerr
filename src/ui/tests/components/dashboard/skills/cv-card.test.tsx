import { describe, expect, it } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { CvCard } from '@/components/dashboard/skills/cv-card';

import { renderWithProviders } from '../../../helpers/render';

const cvFile = { name: 'my-resume.pdf', uploadedAt: '2 days ago' };

const validPdf = new File(['pdf-content'], 'new-resume.pdf', {
	type: 'application/pdf',
});
const largePdf = new File([new Uint8Array(3 * 1024 * 1024)], 'big.pdf', {
	type: 'application/pdf',
});
const nonPdf = new File(['text'], 'doc.txt', { type: 'text/plain' });

describe('CvCard', () => {
	it('renders the current CV filename', () => {
		renderWithProviders(<CvCard cvFile={cvFile} />);

		expect(screen.getByText('my-resume.pdf')).toBeInTheDocument();
	});

	it('renders the upload date', () => {
		renderWithProviders(<CvCard cvFile={cvFile} />);

		expect(screen.getByText(/uploaded 2 days ago/i)).toBeInTheDocument();
	});

	it('renders a "Verified" badge', () => {
		renderWithProviders(<CvCard cvFile={cvFile} />);

		expect(screen.getByText('Verified')).toBeInTheDocument();
	});

	it('renders a Replace button initially', () => {
		renderWithProviders(<CvCard cvFile={cvFile} />);

		expect(screen.getByText('Replace')).toBeInTheDocument();
	});

	it('shows the file preview after a valid PDF is selected', async () => {
		const user = userEvent.setup();
		renderWithProviders(<CvCard cvFile={cvFile} />);

		const input =
			document.querySelector<HTMLInputElement>('input[type="file"]')!;
		await user.upload(input, validPdf);

		await waitFor(() => {
			expect(screen.getByText('new-resume.pdf')).toBeInTheDocument();
			expect(screen.getByText(/ready to replace/i)).toBeInTheDocument();
		});
	});

	it('rejects a non-PDF file', async () => {
		const user = userEvent.setup();
		renderWithProviders(<CvCard cvFile={cvFile} />);

		const input =
			document.querySelector<HTMLInputElement>('input[type="file"]')!;
		await user.upload(input, nonPdf);

		expect(screen.queryByText('doc.txt')).not.toBeInTheDocument();
		expect(screen.getByText('Replace')).toBeInTheDocument();
	});

	it('rejects a file larger than 2 MB', async () => {
		const user = userEvent.setup();
		renderWithProviders(<CvCard cvFile={cvFile} />);

		const input =
			document.querySelector<HTMLInputElement>('input[type="file"]')!;
		await user.upload(input, largePdf);

		expect(screen.queryByText('big.pdf')).not.toBeInTheDocument();
		expect(screen.getByText('Replace')).toBeInTheDocument();
	});

	it('shows Confirm Replace and Cancel buttons in the preview state', async () => {
		const user = userEvent.setup();
		renderWithProviders(<CvCard cvFile={cvFile} />);

		const input =
			document.querySelector<HTMLInputElement>('input[type="file"]')!;
		await user.upload(input, validPdf);

		await waitFor(() => screen.getByText('new-resume.pdf'));

		expect(
			screen.getByRole('button', { name: /confirm replace/i }),
		).toBeInTheDocument();
		expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
	});

	it('clears the selected file when Cancel is clicked', async () => {
		const user = userEvent.setup();
		renderWithProviders(<CvCard cvFile={cvFile} />);

		const input =
			document.querySelector<HTMLInputElement>('input[type="file"]')!;
		await user.upload(input, validPdf);
		await waitFor(() => screen.getByText('new-resume.pdf'));

		await user.click(screen.getByRole('button', { name: /cancel/i }));

		await waitFor(() => {
			expect(screen.queryByText('new-resume.pdf')).not.toBeInTheDocument();
			expect(screen.getByText('Replace')).toBeInTheDocument();
		});
	});

	it('calls the update mutation and clears the preview on confirm', async () => {
		const user = userEvent.setup();
		renderWithProviders(<CvCard cvFile={cvFile} />);

		const input =
			document.querySelector<HTMLInputElement>('input[type="file"]')!;
		await user.upload(input, validPdf);
		await waitFor(() => screen.getByText('new-resume.pdf'));

		await user.click(screen.getByRole('button', { name: /confirm replace/i }));

		await waitFor(() => {
			expect(screen.queryByText('new-resume.pdf')).not.toBeInTheDocument();
		});
	});
});
