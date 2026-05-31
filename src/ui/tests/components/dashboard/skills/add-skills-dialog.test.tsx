import { describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import AddSkillsDialog from '@/components/dashboard/skills/add-skills-dialog';

import { renderWithProviders } from '../../../helpers/render';

function renderDialog(open = true) {
	const onOpenDialog = vi.fn();
	renderWithProviders(
		<AddSkillsDialog open={open} onOpenDialog={onOpenDialog} />,
	);
	return { onOpenDialog };
}

describe('AddSkillsDialog', () => {
	it('renders the dialog when open is true', () => {
		renderDialog();

		expect(screen.getByRole('dialog')).toBeInTheDocument();
		expect(
			screen.getByRole('heading', { name: /add skill/i }),
		).toBeInTheDocument();
	});

	it('does not render the dialog when open is false', () => {
		renderDialog(false);

		expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
	});

	it('renders skill name field and category/level selects', () => {
		renderDialog();

		expect(screen.getByLabelText(/skill name/i)).toBeInTheDocument();
		expect(
			screen.getByRole('combobox', { name: /category/i }),
		).toBeInTheDocument();
		expect(
			screen.getByRole('combobox', { name: /experience level/i }),
		).toBeInTheDocument();
	});

	it('shows a validation error when submitting with an empty name', async () => {
		const user = userEvent.setup();
		renderDialog();

		await user.click(screen.getByRole('button', { name: /add skill/i }));

		await waitFor(() => {
			expect(screen.getByText(/skill name is required/i)).toBeInTheDocument();
		});
	});

	it('submits the form and closes the dialog on success', async () => {
		const user = userEvent.setup();
		const { onOpenDialog } = renderDialog();

		await user.type(screen.getByLabelText(/skill name/i), 'React');

		await user.click(screen.getByRole('combobox', { name: /category/i }));
		await user.click(await screen.findByRole('option', { name: 'Frontend' }));

		await user.click(
			screen.getByRole('combobox', { name: /experience level/i }),
		);
		await user.click(await screen.findByRole('option', { name: 'Advanced' }));

		await user.click(screen.getByRole('button', { name: /add skill/i }));

		await waitFor(() => {
			expect(onOpenDialog).toHaveBeenCalledWith(false);
		});
	});

	it('closes the dialog when the cancel button is clicked', async () => {
		const user = userEvent.setup();
		const { onOpenDialog } = renderDialog();

		await user.click(screen.getByRole('button', { name: /cancel/i }));

		await waitFor(() => {
			expect(onOpenDialog).toHaveBeenCalledWith(false);
		});
	});
});
