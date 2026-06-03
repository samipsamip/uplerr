import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ResumeExtractionType } from '@uppler/types';

import { ReviewEducationSection } from '@/components/dashboard/resume-review/review-education-section';

import { renderWithProviders } from '../../../helpers/render';

type Education = ResumeExtractionType['education'];

function Controlled({ initial }: { initial: Education }) {
	const [edu, setEdu] = useState(initial);
	return <ReviewEducationSection education={edu} onChange={setEdu} />;
}

const education: Education = [
	{
		degree: 'Bachelor of Computer Science',
		institution: 'Tech University',
		field_of_study: 'Computer Science',
		start_date: { raw: 'Sep 2016', normalized: null },
		end_date: { raw: '2020', normalized: null },
	},
	{
		degree: 'Diploma in Web Development',
		institution: 'Online Academy',
		field_of_study: null,
		start_date: { raw: null, normalized: null },
		end_date: { raw: '2018', normalized: null },
	},
];

describe('ReviewEducationSection — display', () => {
	it('renders each degree and institution', () => {
		renderWithProviders(
			<ReviewEducationSection education={education} onChange={vi.fn()} />,
		);
		expect(
			screen.getByText('Bachelor of Computer Science'),
		).toBeInTheDocument();
		expect(screen.getByText('Tech University')).toBeInTheDocument();
		expect(screen.getByText('Diploma in Web Development')).toBeInTheDocument();
		expect(screen.getByText('Online Academy')).toBeInTheDocument();
	});

	it('renders the year for each entry', () => {
		renderWithProviders(
			<ReviewEducationSection education={education} onChange={vi.fn()} />,
		);
		expect(screen.getByText(/2020/)).toBeInTheDocument();
		expect(screen.getByText(/2018/)).toBeInTheDocument();
	});

	it('shows Add qualification button', () => {
		renderWithProviders(
			<ReviewEducationSection education={education} onChange={vi.fn()} />,
		);
		expect(screen.getByText(/add qualification/i)).toBeInTheDocument();
	});

	it('shows Add education button when list is empty', () => {
		renderWithProviders(
			<ReviewEducationSection education={[]} onChange={vi.fn()} />,
		);
		expect(
			screen.getByRole('button', { name: /add education/i }),
		).toBeInTheDocument();
	});
});

describe('ReviewEducationSection — edit', () => {
	it('shows edit form when pencil icon is clicked', async () => {
		const user = userEvent.setup();
		renderWithProviders(
			<ReviewEducationSection education={education} onChange={vi.fn()} />,
		);

		const editButtons = screen.getAllByRole('button', { name: /edit/i });
		await user.click(editButtons[0]);

		expect(
			screen.getByDisplayValue('Bachelor of Computer Science'),
		).toBeInTheDocument();
		expect(screen.getByDisplayValue('Tech University')).toBeInTheDocument();
	});

	it('calls onChange with updated degree on Save', async () => {
		const user = userEvent.setup();
		const onChange = vi.fn();
		renderWithProviders(
			<ReviewEducationSection education={education} onChange={onChange} />,
		);

		const editButtons = screen.getAllByRole('button', { name: /edit/i });
		await user.click(editButtons[0]);

		const degreeInput = screen.getByDisplayValue(
			'Bachelor of Computer Science',
		);
		await user.clear(degreeInput);
		await user.type(degreeInput, 'Master of Science');
		await user.click(screen.getByRole('button', { name: /save/i }));

		expect(onChange).toHaveBeenCalledOnce();
		expect(onChange.mock.calls[0][0][0].degree).toBe('Master of Science');
	});

	it('reverts changes on Discard', async () => {
		const user = userEvent.setup();
		const onChange = vi.fn();
		renderWithProviders(
			<ReviewEducationSection education={education} onChange={onChange} />,
		);

		const editButtons = screen.getAllByRole('button', { name: /edit/i });
		await user.click(editButtons[0]);

		const degreeInput = screen.getByDisplayValue(
			'Bachelor of Computer Science',
		);
		await user.clear(degreeInput);
		await user.type(degreeInput, 'Something else');
		await user.click(screen.getByRole('button', { name: /discard/i }));

		expect(onChange).not.toHaveBeenCalled();
		expect(
			screen.getByText('Bachelor of Computer Science'),
		).toBeInTheDocument();
	});

	it('removes an entry when the delete button is clicked', async () => {
		const user = userEvent.setup();
		const onChange = vi.fn();
		renderWithProviders(
			<ReviewEducationSection education={education} onChange={onChange} />,
		);

		const deleteButtons = screen.getAllByRole('button', { name: /remove/i });
		await user.click(deleteButtons[0]);

		expect(onChange).toHaveBeenCalledOnce();
		expect(onChange.mock.calls[0][0]).toHaveLength(1);
	});
});

describe('ReviewEducationSection — add entry', () => {
	it('appends a new entry and opens it immediately in edit mode', async () => {
		const user = userEvent.setup();
		renderWithProviders(<Controlled initial={education} />);

		await user.click(screen.getByText(/add qualification/i));

		const degreeInputs = screen.getAllByRole('textbox');
		expect(degreeInputs.length).toBeGreaterThan(2);
	});
});

describe('ReviewEducationSection — field-level edits', () => {
	it('updates institution field', async () => {
		const user = userEvent.setup();
		renderWithProviders(
			<ReviewEducationSection education={education} onChange={vi.fn()} />,
		);
		const editButtons = screen.getAllByRole('button', { name: /edit/i });
		await user.click(editButtons[0]);
		const institutionInput = screen.getByDisplayValue('Tech University');
		await user.clear(institutionInput);
		await user.type(institutionInput, 'MIT');
		expect(screen.getByDisplayValue('MIT')).toBeInTheDocument();
	});

	it('updates field_of_study field', async () => {
		const user = userEvent.setup();
		renderWithProviders(
			<ReviewEducationSection education={education} onChange={vi.fn()} />,
		);
		const editButtons = screen.getAllByRole('button', { name: /edit/i });
		await user.click(editButtons[0]);
		const fieldInput = screen.getByDisplayValue('Computer Science');
		await user.clear(fieldInput);
		await user.type(fieldInput, 'Software Engineering');
		expect(
			screen.getByDisplayValue('Software Engineering'),
		).toBeInTheDocument();
	});

	it('updates start_date field', async () => {
		const user = userEvent.setup();
		renderWithProviders(
			<ReviewEducationSection education={education} onChange={vi.fn()} />,
		);
		const editButtons = screen.getAllByRole('button', { name: /edit/i });
		await user.click(editButtons[0]);
		const startInput = screen.getByDisplayValue('Sep 2016');
		await user.clear(startInput);
		await user.type(startInput, 'Sep 2017');
		expect(screen.getByDisplayValue('Sep 2017')).toBeInTheDocument();
	});

	it('updates end_date field', async () => {
		const user = userEvent.setup();
		renderWithProviders(
			<ReviewEducationSection education={education} onChange={vi.fn()} />,
		);
		const editButtons = screen.getAllByRole('button', { name: /edit/i });
		await user.click(editButtons[0]);
		const endInput = screen.getByDisplayValue('2020');
		await user.clear(endInput);
		await user.type(endInput, '2021');
		expect(screen.getByDisplayValue('2021')).toBeInTheDocument();
	});
});
