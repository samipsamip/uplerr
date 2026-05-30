import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ResumeStructuredData } from '@uppler/types';

import { ReviewProjectsSection } from '@/components/dashboard/resume-review/review-projects-section';

import { renderWithProviders } from '../../../helpers/render';

type Projects = NonNullable<ResumeStructuredData['projects']>;

function Controlled({ initial }: { initial: Projects }) {
	const [projects, setProjects] = useState(initial);
	return <ReviewProjectsSection projects={projects} onChange={setProjects} />;
}

const projects = [
	{
		name: 'My Portfolio',
		description: 'A personal website showcasing my work.',
		url: 'https://portfolio.dev',
		technologies: ['React', 'TypeScript', 'SomethingObscure'],
	},
	{
		name: 'API Service',
		description: undefined,
		url: undefined,
		technologies: [],
	},
];

describe('ReviewProjectsSection — display', () => {
	it('renders each project name', () => {
		renderWithProviders(
			<ReviewProjectsSection projects={projects} onChange={vi.fn()} />,
		);
		expect(screen.getByText('My Portfolio')).toBeInTheDocument();
		expect(screen.getByText('API Service')).toBeInTheDocument();
	});

	it('renders the project description when present', () => {
		renderWithProviders(
			<ReviewProjectsSection projects={projects} onChange={vi.fn()} />,
		);
		expect(screen.getByText(/personal website/i)).toBeInTheDocument();
	});

	it('renders an external link when URL is present', () => {
		renderWithProviders(
			<ReviewProjectsSection projects={projects} onChange={vi.fn()} />,
		);
		expect(screen.getByRole('link', { name: /view project/i })).toHaveAttribute(
			'href',
			'https://portfolio.dev',
		);
	});

	it('shows "SomethingObscure" as text pill (no icon available)', () => {
		renderWithProviders(
			<ReviewProjectsSection projects={projects} onChange={vi.fn()} />,
		);
		expect(screen.getByText('SomethingObscure')).toBeInTheDocument();
	});

	it('shows Add project button', () => {
		renderWithProviders(
			<ReviewProjectsSection projects={projects} onChange={vi.fn()} />,
		);
		expect(screen.getByText(/add project/i)).toBeInTheDocument();
	});

	it('shows Add project button as the only element when list is empty', () => {
		renderWithProviders(
			<ReviewProjectsSection projects={[]} onChange={vi.fn()} />,
		);
		expect(
			screen.getByRole('button', { name: /add project/i }),
		).toBeInTheDocument();
	});
});

describe('ReviewProjectsSection — edit', () => {
	it('shows edit form when pencil button is clicked', async () => {
		const user = userEvent.setup();
		renderWithProviders(
			<ReviewProjectsSection projects={projects} onChange={vi.fn()} />,
		);

		const editButtons = screen.getAllByRole('button', { name: /edit/i });
		await user.click(editButtons[0]);

		expect(screen.getByDisplayValue('My Portfolio')).toBeInTheDocument();
	});

	it('calls onChange with updated name on Save', async () => {
		const user = userEvent.setup();
		const onChange = vi.fn();
		renderWithProviders(
			<ReviewProjectsSection projects={projects} onChange={onChange} />,
		);

		const editButtons = screen.getAllByRole('button', { name: /edit/i });
		await user.click(editButtons[0]);

		const nameInput = screen.getByDisplayValue('My Portfolio');
		await user.clear(nameInput);
		await user.type(nameInput, 'New Name');
		await user.click(screen.getByRole('button', { name: /save/i }));

		expect(onChange).toHaveBeenCalledOnce();
		expect(onChange.mock.calls[0][0][0].name).toBe('New Name');
	});

	it('reverts on Discard', async () => {
		const user = userEvent.setup();
		const onChange = vi.fn();
		renderWithProviders(
			<ReviewProjectsSection projects={projects} onChange={onChange} />,
		);

		const editButtons = screen.getAllByRole('button', { name: /edit/i });
		await user.click(editButtons[0]);

		const nameInput = screen.getByDisplayValue('My Portfolio');
		await user.clear(nameInput);
		await user.type(nameInput, 'Draft name');
		await user.click(screen.getByRole('button', { name: /discard/i }));

		expect(onChange).not.toHaveBeenCalled();
		expect(screen.getByText('My Portfolio')).toBeInTheDocument();
	});

	it('removes a project when delete is clicked', async () => {
		const user = userEvent.setup();
		const onChange = vi.fn();
		renderWithProviders(
			<ReviewProjectsSection projects={projects} onChange={onChange} />,
		);

		const deleteButtons = screen.getAllByRole('button', { name: /remove/i });
		await user.click(deleteButtons[0]);

		expect(onChange).toHaveBeenCalledOnce();
		expect(onChange.mock.calls[0][0]).toHaveLength(1);
	});
});

describe('ReviewProjectsSection — add entry', () => {
	it('appends a new entry and opens it immediately in edit mode', async () => {
		const user = userEvent.setup();
		renderWithProviders(<Controlled initial={projects} />);

		await user.click(screen.getByText(/add project/i));

		// New entry is in edit mode: the name input with placeholder is visible
		expect(
			screen.getByPlaceholderText(/open source cli tool/i),
		).toBeInTheDocument();
	});
});
