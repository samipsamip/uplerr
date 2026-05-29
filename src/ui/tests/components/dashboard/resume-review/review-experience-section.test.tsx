import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ResumeStructuredData } from '@uppler/types';

import { ReviewExperienceSection } from '@/components/dashboard/resume-review/review-experience-section';

import { renderWithProviders } from '../../../helpers/render';

type Experience = ResumeStructuredData['experience'];

function Controlled({ initial }: { initial: Experience }) {
	const [exp, setExp] = useState(initial);
	return <ReviewExperienceSection experience={exp} onChange={setExp} />;
}

// First description exceeds TRUNCATE_AT (180 chars) to trigger Show more
const experience = [
	{
		role: 'Senior Engineer',
		company: 'Acme Corp',
		duration: 'Jan 2021 – Present',
		description:
			'Led a team of five engineers building a distributed payment system across multiple cloud regions. Reduced latency by 40% through strategic caching and query optimisation. Mentored junior developers and drove technical roadmap planning for the next two years.',
	},
	{
		role: 'Junior Developer',
		company: 'StartupXYZ',
		duration: 'Jun 2019 – Dec 2020',
		description: 'Built React components and unit tests.',
	},
];

describe('ReviewExperienceSection — display', () => {
	it('renders each role and company', () => {
		renderWithProviders(
			<ReviewExperienceSection experience={experience} onChange={vi.fn()} />,
		);
		expect(screen.getByText('Senior Engineer')).toBeInTheDocument();
		expect(screen.getByText('Acme Corp')).toBeInTheDocument();
		expect(screen.getByText('Junior Developer')).toBeInTheDocument();
		expect(screen.getByText('StartupXYZ')).toBeInTheDocument();
	});

	it('renders the duration for each entry', () => {
		renderWithProviders(
			<ReviewExperienceSection experience={experience} onChange={vi.fn()} />,
		);
		expect(screen.getByText(/jan 2021.*present/i)).toBeInTheDocument();
	});

	it('shows "Looks good" badge for well-formed entries', () => {
		renderWithProviders(
			<ReviewExperienceSection experience={experience} onChange={vi.fn()} />,
		);
		expect(screen.getAllByText(/looks good/i).length).toBeGreaterThanOrEqual(1);
	});

	it('shows "Review suggested" for entries missing key fields', () => {
		renderWithProviders(
			<ReviewExperienceSection
				experience={[{ role: '', company: '', description: 'Something' }]}
				onChange={vi.fn()}
			/>,
		);
		expect(screen.getByText(/review suggested/i)).toBeInTheDocument();
	});

	it('shows Add position button', () => {
		renderWithProviders(
			<ReviewExperienceSection experience={experience} onChange={vi.fn()} />,
		);
		expect(screen.getByText(/add position/i)).toBeInTheDocument();
	});

	it('shows Add experience button when list is empty', () => {
		renderWithProviders(
			<ReviewExperienceSection experience={[]} onChange={vi.fn()} />,
		);
		expect(
			screen.getByRole('button', { name: /add experience/i }),
		).toBeInTheDocument();
	});
});

describe('ReviewExperienceSection — truncation', () => {
	it('truncates long descriptions and shows Show more', () => {
		renderWithProviders(
			<ReviewExperienceSection experience={experience} onChange={vi.fn()} />,
		);
		// First entry description is > 180 chars
		expect(
			screen.getByRole('button', { name: /show more/i }),
		).toBeInTheDocument();
	});

	it('expands the description when Show more is clicked', async () => {
		const user = userEvent.setup();
		renderWithProviders(
			<ReviewExperienceSection experience={experience} onChange={vi.fn()} />,
		);

		await user.click(screen.getByRole('button', { name: /show more/i }));

		expect(
			screen.getByRole('button', { name: /show less/i }),
		).toBeInTheDocument();
	});
});

describe('ReviewExperienceSection — edit', () => {
	it('opens edit form when pencil is clicked', async () => {
		const user = userEvent.setup();
		renderWithProviders(
			<ReviewExperienceSection experience={experience} onChange={vi.fn()} />,
		);

		const editButtons = screen.getAllByRole('button', { name: /edit/i });
		await user.click(editButtons[0]);

		expect(screen.getByDisplayValue('Senior Engineer')).toBeInTheDocument();
		expect(screen.getByDisplayValue('Acme Corp')).toBeInTheDocument();
	});

	it('calls onChange with updated role on Save', async () => {
		const user = userEvent.setup();
		const onChange = vi.fn();
		renderWithProviders(
			<ReviewExperienceSection experience={experience} onChange={onChange} />,
		);

		const editButtons = screen.getAllByRole('button', { name: /edit/i });
		await user.click(editButtons[0]);

		const roleInput = screen.getByDisplayValue('Senior Engineer');
		await user.clear(roleInput);
		await user.type(roleInput, 'Staff Engineer');
		await user.click(screen.getByRole('button', { name: /save/i }));

		expect(onChange).toHaveBeenCalledOnce();
		expect(onChange.mock.calls[0][0][0].role).toBe('Staff Engineer');
	});

	it('reverts on Discard', async () => {
		const user = userEvent.setup();
		const onChange = vi.fn();
		renderWithProviders(
			<ReviewExperienceSection experience={experience} onChange={onChange} />,
		);

		const editButtons = screen.getAllByRole('button', { name: /edit/i });
		await user.click(editButtons[0]);

		const roleInput = screen.getByDisplayValue('Senior Engineer');
		await user.clear(roleInput);
		await user.type(roleInput, 'Draft role');
		await user.click(screen.getByRole('button', { name: /discard/i }));

		expect(onChange).not.toHaveBeenCalled();
		expect(screen.getByText('Senior Engineer')).toBeInTheDocument();
	});

	it('removes an entry when delete is clicked', async () => {
		const user = userEvent.setup();
		const onChange = vi.fn();
		renderWithProviders(
			<ReviewExperienceSection experience={experience} onChange={onChange} />,
		);

		const deleteButtons = screen.getAllByRole('button', { name: /remove/i });
		await user.click(deleteButtons[0]);

		expect(onChange).toHaveBeenCalledOnce();
		expect(onChange.mock.calls[0][0]).toHaveLength(1);
	});
});

describe('ReviewExperienceSection — add entry', () => {
	it('appends a new entry and opens it immediately in edit mode', async () => {
		const user = userEvent.setup();
		renderWithProviders(<Controlled initial={experience} />);

		await user.click(screen.getByText(/add position/i));

		// New entry renders in edit mode: its role input (empty) is now visible
		const emptyInputs = screen
			.getAllByRole('textbox')
			.filter((el) => (el as HTMLInputElement).value === '');
		expect(emptyInputs.length).toBeGreaterThanOrEqual(1);
	});
});
