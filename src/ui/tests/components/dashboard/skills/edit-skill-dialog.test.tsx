import { describe, expect, it, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { UserSkill } from '@uppler/types';

import { EditSkillDialog } from '@/components/dashboard/skills/edit-skill-dialog';

import { renderWithProviders } from '../../../helpers/render';

const skill: UserSkill = {
	id: 'skill-1',
	name: 'TypeScript',
	category: 'Frontend',
	level: 'expert',
	source: 'manual',
};

function renderDialog(open = true) {
	const onOpenChange = vi.fn();
	renderWithProviders(
		<EditSkillDialog skill={skill} open={open} onOpenChange={onOpenChange} />,
	);
	return { onOpenChange };
}

describe('EditSkillDialog', () => {
	it('renders the dialog with pre-filled values', () => {
		renderDialog();

		expect(screen.getByRole('dialog')).toBeInTheDocument();
		expect(screen.getByDisplayValue('TypeScript')).toBeInTheDocument();

		const dialog = screen.getByRole('dialog');
		expect(
			within(dialog).getByRole('combobox', { name: /category/i }),
		).toHaveTextContent('Frontend');
		expect(
			within(dialog).getByRole('combobox', { name: /experience level/i }),
		).toHaveTextContent('Expert');
	});

	it('does not render when open is false', () => {
		renderDialog(false);

		expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
	});

	it('shows a "Remove skill" button initially', () => {
		renderDialog();

		expect(
			screen.getByRole('button', { name: /remove skill/i }),
		).toBeInTheDocument();
	});

	it('shows confirmation UI when the remove button is clicked', async () => {
		const user = userEvent.setup();
		renderDialog();

		await user.click(screen.getByRole('button', { name: /remove skill/i }));

		expect(screen.getByText(/remove this skill/i)).toBeInTheDocument();
		expect(
			screen.getByRole('button', { name: /confirm/i }),
		).toBeInTheDocument();
	});

	it('hides confirmation UI when cancel is clicked during deletion', async () => {
		const user = userEvent.setup();
		renderDialog();

		await user.click(screen.getByRole('button', { name: /remove skill/i }));

		// Two Cancel buttons exist: one in the confirm UI, one in the dialog footer
		const cancelButtons = screen.getAllByRole('button', { name: /cancel/i });
		await user.click(cancelButtons[0]);

		await waitFor(() => {
			expect(screen.queryByText(/remove this skill/i)).not.toBeInTheDocument();
		});
	});

	it('calls the delete mutation and closes the dialog on confirm', async () => {
		const user = userEvent.setup();
		const { onOpenChange } = renderDialog();

		await user.click(screen.getByRole('button', { name: /remove skill/i }));
		await user.click(screen.getByRole('button', { name: /confirm/i }));

		await waitFor(() => {
			expect(onOpenChange).toHaveBeenCalledWith(false);
		});
	});

	it('submits updated name and closes the dialog', async () => {
		const user = userEvent.setup();
		const { onOpenChange } = renderDialog();

		const nameInput = screen.getByDisplayValue('TypeScript');
		await user.clear(nameInput);
		await user.type(nameInput, 'TypeScript 5');
		await user.click(screen.getByRole('button', { name: /save changes/i }));

		await waitFor(() => {
			expect(onOpenChange).toHaveBeenCalledWith(false);
		});
	});

	it('can change the category via the select', async () => {
		const user = userEvent.setup();
		renderDialog();

		await user.click(screen.getByRole('combobox', { name: /category/i }));
		await user.click(await screen.findByRole('option', { name: 'Backend' }));

		expect(
			screen.getByRole('combobox', { name: /category/i }),
		).toHaveTextContent('Backend');
	});
});
