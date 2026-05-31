import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ProjectExtractionType } from '@uppler/types';

import { ReviewProjectsSection } from '@/components/dashboard/resume-review/review-projects-section';

import { renderWithProviders } from '../../../helpers/render';

type Projects = ProjectExtractionType;

function Controlled({ initial }: { initial: Projects }) {
	const [projects, setProjects] = useState(initial);
	return <ReviewProjectsSection projects={projects} onChange={setProjects} />;
}

const projects: Projects = {
	projects: [
		{
			name: 'Uppler Dashboard',
			description: 'A job search platform built with React and TypeScript.',
			technologies: ['React', 'TypeScript'],
			links: ['https://github.com/example/uppler'],
			type: 'solo',
			source: 'projects_section',
		},
		{
			name: 'Work Tracker API',
			description: 'REST API for tracking work hours and productivity.',
			technologies: ['Node.js', 'PostgreSQL'],
			links: [],
			type: 'company',
			source: 'projects_section',
		},
	],
};

const emptyProjects: Projects = { projects: [] };

describe('ReviewProjectsSection — display', () => {
	it('renders each project name', () => {
		renderWithProviders(
			<ReviewProjectsSection projects={projects} onChange={vi.fn()} />,
		);
		expect(screen.getByText('Uppler Dashboard')).toBeInTheDocument();
		expect(screen.getByText('Work Tracker API')).toBeInTheDocument();
	});

	it('renders project descriptions', () => {
		renderWithProviders(
			<ReviewProjectsSection projects={projects} onChange={vi.fn()} />,
		);
		expect(screen.getByText(/job search platform/i)).toBeInTheDocument();
	});

	it('renders technology chips', () => {
		renderWithProviders(
			<ReviewProjectsSection projects={projects} onChange={vi.fn()} />,
		);
		expect(screen.getByText('React')).toBeInTheDocument();
		expect(screen.getByText('TypeScript')).toBeInTheDocument();
	});

	it('renders project links', () => {
		renderWithProviders(
			<ReviewProjectsSection projects={projects} onChange={vi.fn()} />,
		);
		expect(
			screen.getByText('https://github.com/example/uppler'),
		).toBeInTheDocument();
	});

	it('shows a quality badge for each project', () => {
		renderWithProviders(
			<ReviewProjectsSection projects={projects} onChange={vi.fn()} />,
		);
		expect(
			screen.getAllByText(/looks good|review suggested/i).length,
		).toBeGreaterThanOrEqual(1);
	});

	it('shows type badges', () => {
		renderWithProviders(
			<ReviewProjectsSection projects={projects} onChange={vi.fn()} />,
		);
		expect(screen.getByText('Personal')).toBeInTheDocument();
		expect(screen.getByText('Company')).toBeInTheDocument();
	});

	it('shows an add button at the bottom', () => {
		renderWithProviders(
			<ReviewProjectsSection projects={projects} onChange={vi.fn()} />,
		);
		expect(
			screen.getByRole('button', { name: /add project/i }),
		).toBeInTheDocument();
	});
});

describe('ReviewProjectsSection — empty state', () => {
	it('shows "No projects extracted" message', () => {
		renderWithProviders(
			<ReviewProjectsSection projects={emptyProjects} onChange={vi.fn()} />,
		);
		expect(screen.getByText(/no projects extracted/i)).toBeInTheDocument();
	});

	it('shows an Add project button in the empty state', () => {
		renderWithProviders(
			<ReviewProjectsSection projects={emptyProjects} onChange={vi.fn()} />,
		);
		expect(
			screen.getByRole('button', { name: /add project/i }),
		).toBeInTheDocument();
	});
});

describe('ReviewProjectsSection — edit', () => {
	it('opens edit form when edit button is clicked', async () => {
		const user = userEvent.setup();
		renderWithProviders(
			<ReviewProjectsSection projects={projects} onChange={vi.fn()} />,
		);

		await user.click(
			screen.getAllByRole('button', { name: /edit project/i })[0],
		);

		expect(screen.getByDisplayValue('Uppler Dashboard')).toBeInTheDocument();
	});

	it('saves changes and calls onChange', async () => {
		const user = userEvent.setup();
		const onChange = vi.fn();
		renderWithProviders(
			<ReviewProjectsSection projects={projects} onChange={onChange} />,
		);

		await user.click(
			screen.getAllByRole('button', { name: /edit project/i })[0],
		);

		const nameInput = screen.getByDisplayValue('Uppler Dashboard');
		await user.clear(nameInput);
		await user.type(nameInput, 'Uppler v2');
		await user.click(screen.getByRole('button', { name: /^save$/i }));

		await waitFor(() => {
			expect(onChange).toHaveBeenCalledOnce();
			expect(onChange.mock.calls[0][0].projects[0].name).toBe('Uppler v2');
		});
	});

	it('reverts changes on Discard', async () => {
		const user = userEvent.setup();
		const onChange = vi.fn();
		renderWithProviders(
			<ReviewProjectsSection projects={projects} onChange={onChange} />,
		);

		await user.click(
			screen.getAllByRole('button', { name: /edit project/i })[0],
		);
		const nameInput = screen.getByDisplayValue('Uppler Dashboard');
		await user.clear(nameInput);
		await user.type(nameInput, 'Changed name');
		await user.click(screen.getByRole('button', { name: /discard/i }));

		expect(onChange).not.toHaveBeenCalled();
		expect(screen.getByText('Uppler Dashboard')).toBeInTheDocument();
	});

	it('shows validation error when name is cleared', async () => {
		const user = userEvent.setup();
		renderWithProviders(
			<ReviewProjectsSection projects={projects} onChange={vi.fn()} />,
		);

		await user.click(
			screen.getAllByRole('button', { name: /edit project/i })[0],
		);
		const nameInput = screen.getByDisplayValue('Uppler Dashboard');
		await user.clear(nameInput);
		await user.click(screen.getByRole('button', { name: /^save$/i }));

		await waitFor(() => {
			expect(screen.getByText(/project name is required/i)).toBeInTheDocument();
		});
	});

	it('shows validation error when description is cleared', async () => {
		const user = userEvent.setup();
		renderWithProviders(
			<ReviewProjectsSection projects={projects} onChange={vi.fn()} />,
		);

		await user.click(
			screen.getAllByRole('button', { name: /edit project/i })[0],
		);
		const descInput = screen.getByDisplayValue(/job search platform/i);
		await user.clear(descInput);
		await user.click(screen.getByRole('button', { name: /^save$/i }));

		await waitFor(() => {
			expect(screen.getByText(/description is required/i)).toBeInTheDocument();
		});
	});

	it('removes a project when remove button is clicked', async () => {
		const user = userEvent.setup();
		const onChange = vi.fn();
		renderWithProviders(
			<ReviewProjectsSection projects={projects} onChange={onChange} />,
		);

		await user.click(
			screen.getAllByRole('button', { name: /remove project/i })[0],
		);

		expect(onChange).toHaveBeenCalledOnce();
		expect(onChange.mock.calls[0][0].projects).toHaveLength(1);
	});
});

describe('ReviewProjectsSection — add project', () => {
	it('appends a new project card when Add project is clicked', async () => {
		const user = userEvent.setup();
		renderWithProviders(<Controlled initial={projects} />);

		const before = screen.getAllByRole('button', {
			name: /edit project/i,
		}).length;
		await user.click(screen.getByRole('button', { name: /add project/i }));

		await waitFor(() => {
			expect(
				screen.getAllByRole('button', { name: /edit project/i }).length,
			).toBe(before + 1);
		});
	});

	it('shows an "Untitled project" placeholder when a new project is added from empty state', async () => {
		const user = userEvent.setup();
		renderWithProviders(<Controlled initial={emptyProjects} />);

		await user.click(screen.getByRole('button', { name: /add project/i }));

		await waitFor(() => {
			expect(screen.getByText(/untitled project/i)).toBeInTheDocument();
		});
	});
});

describe('ReviewProjectsSection — type selector', () => {
	it('changes the project type when a type button is clicked', async () => {
		const user = userEvent.setup();
		const onChange = vi.fn();
		renderWithProviders(
			<ReviewProjectsSection projects={projects} onChange={onChange} />,
		);

		await user.click(
			screen.getAllByRole('button', { name: /edit project/i })[0],
		);

		await user.click(screen.getByRole('button', { name: /freelance/i }));
		await user.click(screen.getByRole('button', { name: /^save$/i }));

		await waitFor(() => {
			expect(onChange).toHaveBeenCalledOnce();
			expect(onChange.mock.calls[0][0].projects[0].type).toBe('freelance');
		});
	});
});
