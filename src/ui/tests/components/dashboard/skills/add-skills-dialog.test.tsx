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

	it('renders skill name, category, and level fields', () => {
		renderDialog();

		expect(screen.getByLabelText(/skill name/i)).toBeInTheDocument();
		expect(screen.getByLabelText(/category/i)).toBeInTheDocument();
		expect(screen.getByLabelText(/experience level/i)).toBeInTheDocument();
	});

	it('shows validation errors when submitting an empty form', async () => {
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
		await user.selectOptions(screen.getByLabelText(/category/i), 'Frontend');
		await user.selectOptions(
			screen.getByLabelText(/experience level/i),
			'advanced',
		);
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
