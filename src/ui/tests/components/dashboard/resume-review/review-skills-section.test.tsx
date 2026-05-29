import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ReviewSkillsSection } from '@/components/dashboard/resume-review/review-skills-section';

import { renderWithProviders } from '../../../helpers/render';

const skills = ['React', 'Node.js', 'Docker', 'SoftSkillX'];

describe('ReviewSkillsSection — display', () => {
	it('renders each skill name', () => {
		renderWithProviders(
			<ReviewSkillsSection skills={skills} onChange={vi.fn()} />,
		);
		expect(screen.getByText('React')).toBeInTheDocument();
		expect(screen.getByText('Node.js')).toBeInTheDocument();
		expect(screen.getByText('Docker')).toBeInTheDocument();
		expect(screen.getByText('SoftSkillX')).toBeInTheDocument();
	});

	it('groups skills into categories from the catalog', () => {
		renderWithProviders(
			<ReviewSkillsSection skills={skills} onChange={vi.fn()} />,
		);
		expect(screen.getByText(/frontend/i)).toBeInTheDocument();
		expect(screen.getByText(/backend/i)).toBeInTheDocument();
		expect(screen.getByText(/devops/i)).toBeInTheDocument();
		expect(screen.getByText(/other/i)).toBeInTheDocument();
	});

	it('shows the Add skill button', () => {
		renderWithProviders(
			<ReviewSkillsSection skills={skills} onChange={vi.fn()} />,
		);
		expect(
			screen.getByRole('button', { name: /add skill/i }),
		).toBeInTheDocument();
	});

	it('shows the Edit skills button', () => {
		renderWithProviders(
			<ReviewSkillsSection skills={skills} onChange={vi.fn()} />,
		);
		expect(
			screen.getByRole('button', { name: /edit skills/i }),
		).toBeInTheDocument();
	});
});

describe('ReviewSkillsSection — remove skill', () => {
	it('calls onChange without the removed skill', async () => {
		const user = userEvent.setup();
		const onChange = vi.fn();
		renderWithProviders(
			<ReviewSkillsSection skills={skills} onChange={onChange} />,
		);

		await user.click(screen.getByRole('button', { name: /remove react/i }));

		expect(onChange).toHaveBeenCalledOnce();
		expect(onChange.mock.calls[0][0]).not.toContain('React');
		expect(onChange.mock.calls[0][0]).toContain('Node.js');
	});
});

describe('ReviewSkillsSection — add skill', () => {
	it('shows an input after clicking Add skill', async () => {
		const user = userEvent.setup();
		renderWithProviders(
			<ReviewSkillsSection skills={skills} onChange={vi.fn()} />,
		);

		await user.click(screen.getByRole('button', { name: /add skill/i }));

		expect(screen.getByPlaceholderText(/skill name/i)).toBeInTheDocument();
	});

	it('calls onChange with the new skill on Enter', async () => {
		const user = userEvent.setup();
		const onChange = vi.fn();
		renderWithProviders(
			<ReviewSkillsSection skills={skills} onChange={onChange} />,
		);

		await user.click(screen.getByRole('button', { name: /add skill/i }));
		await user.type(
			screen.getByPlaceholderText(/skill name/i),
			'GraphQL{Enter}',
		);

		expect(onChange).toHaveBeenCalledOnce();
		expect(onChange.mock.calls[0][0]).toContain('GraphQL');
	});

	it('does not add an empty skill', async () => {
		const user = userEvent.setup();
		const onChange = vi.fn();
		renderWithProviders(
			<ReviewSkillsSection skills={skills} onChange={onChange} />,
		);

		await user.click(screen.getByRole('button', { name: /add skill/i }));
		await user.keyboard('{Enter}');

		expect(onChange).not.toHaveBeenCalled();
	});

	it('does not add a duplicate skill', async () => {
		const user = userEvent.setup();
		const onChange = vi.fn();
		renderWithProviders(
			<ReviewSkillsSection skills={skills} onChange={onChange} />,
		);

		await user.click(screen.getByRole('button', { name: /add skill/i }));
		await user.type(screen.getByPlaceholderText(/skill name/i), 'React{Enter}');

		expect(onChange).not.toHaveBeenCalled();
	});

	it('closes the input on Escape without calling onChange', async () => {
		const user = userEvent.setup();
		const onChange = vi.fn();
		renderWithProviders(
			<ReviewSkillsSection skills={skills} onChange={onChange} />,
		);

		await user.click(screen.getByRole('button', { name: /add skill/i }));
		await user.keyboard('{Escape}');

		expect(onChange).not.toHaveBeenCalled();
		expect(
			screen.queryByPlaceholderText(/skill name/i),
		).not.toBeInTheDocument();
	});
});

describe('ReviewSkillsSection — manage mode', () => {
	it('opens the manage panel when Edit skills is clicked', async () => {
		const user = userEvent.setup();
		renderWithProviders(
			<ReviewSkillsSection skills={skills} onChange={vi.fn()} />,
		);

		await user.click(screen.getByRole('button', { name: /edit skills/i }));

		expect(screen.getByText('Manage Skills')).toBeInTheDocument();
		expect(screen.getByRole('button', { name: /done/i })).toBeInTheDocument();
	});

	it('shows an input row for each skill in manage mode', async () => {
		const user = userEvent.setup();
		renderWithProviders(
			<ReviewSkillsSection skills={skills} onChange={vi.fn()} />,
		);

		await user.click(screen.getByRole('button', { name: /edit skills/i }));

		const inputs = screen.getAllByPlaceholderText(/skill name/i);
		expect(inputs.length).toBe(skills.length);
	});

	it('removes a skill row in manage mode', async () => {
		const user = userEvent.setup();
		const onChange = vi.fn();
		renderWithProviders(
			<ReviewSkillsSection skills={['React', 'Docker']} onChange={onChange} />,
		);

		await user.click(screen.getByRole('button', { name: /edit skills/i }));

		const removeButtons = screen.getAllByRole('button', { name: /remove/i });
		await user.click(removeButtons[0]);

		await user.click(screen.getByRole('button', { name: /done/i }));

		expect(onChange).toHaveBeenCalledOnce();
		expect(onChange.mock.calls[0][0]).toHaveLength(1);
	});

	it('commits renamed skills when Done is clicked', async () => {
		const user = userEvent.setup();
		const onChange = vi.fn();
		renderWithProviders(
			<ReviewSkillsSection skills={['React']} onChange={onChange} />,
		);

		await user.click(screen.getByRole('button', { name: /edit skills/i }));

		const input = screen.getByDisplayValue('React');
		await user.clear(input);
		await user.type(input, 'React 18');

		await user.click(screen.getByRole('button', { name: /done/i }));

		expect(onChange).toHaveBeenCalledWith(['React 18']);
	});

	it('adds a new skill row in manage mode', async () => {
		const user = userEvent.setup();
		renderWithProviders(
			<ReviewSkillsSection skills={['React']} onChange={vi.fn()} />,
		);

		await user.click(screen.getByRole('button', { name: /edit skills/i }));

		const countBefore = screen.getAllByPlaceholderText(/skill name/i).length;
		await user.click(screen.getByRole('button', { name: /add skill/i }));

		expect(screen.getAllByPlaceholderText(/skill name/i).length).toBe(
			countBefore + 1,
		);
	});

	it('exits manage mode and returns to chip view when Done is clicked', async () => {
		const user = userEvent.setup();
		renderWithProviders(
			<ReviewSkillsSection skills={skills} onChange={vi.fn()} />,
		);

		await user.click(screen.getByRole('button', { name: /edit skills/i }));
		await user.click(screen.getByRole('button', { name: /done/i }));

		expect(screen.queryByText('Manage Skills')).not.toBeInTheDocument();
		expect(
			screen.getByRole('button', { name: /edit skills/i }),
		).toBeInTheDocument();
	});
});
