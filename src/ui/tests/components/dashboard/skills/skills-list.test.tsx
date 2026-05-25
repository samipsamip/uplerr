import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { SkillsList } from '@/components/dashboard/skills/skills-list';

import { renderWithProviders } from '../../../helpers/render';
import { BASE, mockSkill } from '../../../msw/handlers';
import { server } from '../../../msw/server';

describe('SkillsList', () => {
	it('renders the "Your Skills" heading', async () => {
		renderWithProviders(<SkillsList />);

		expect(screen.getByText('Your Skills')).toBeInTheDocument();
	});

	it('shows the empty state when no skills are returned', async () => {
		renderWithProviders(<SkillsList />);
		await waitFor(() => {
			expect(
				screen.getByRole('button', { name: /add your first skill/i }),
			).toBeInTheDocument();
		});
	});

	it('renders skills grouped by category when data is present', async () => {
		server.use(
			http.get(`${BASE}/api/skills`, () =>
				HttpResponse.json([
					mockSkill,
					{
						id: 'skill-2',
						name: 'Node.js',
						category: 'Backend',
						level: 'advanced',
						source: 'manual',
					},
				]),
			),
		);

		renderWithProviders(<SkillsList />);

		await waitFor(() => {
			expect(screen.getByText('TypeScript')).toBeInTheDocument();
			expect(screen.getByText('Node.js')).toBeInTheDocument();
		});

		expect(screen.getByText('Frontend')).toBeInTheDocument();
		expect(screen.getByText('Backend')).toBeInTheDocument();
	});

	it('shows the skill count in the heading when skills exist', async () => {
		server.use(
			http.get(`${BASE}/api/skills`, () => HttpResponse.json([mockSkill])),
		);

		renderWithProviders(<SkillsList />);

		await waitFor(() => {
			expect(screen.getByText('(1)')).toBeInTheDocument();
		});
	});

	it('opens the add-skill dialog from the empty state button', async () => {
		const user = userEvent.setup();
		renderWithProviders(<SkillsList />);

		await waitFor(() =>
			screen.getByRole('button', { name: /add your first skill/i }),
		);
		await user.click(
			screen.getByRole('button', { name: /add your first skill/i }),
		);

		expect(screen.getByRole('dialog')).toBeInTheDocument();
		expect(
			screen.getByRole('heading', { name: /add skill/i }),
		).toBeInTheDocument();
	});

	it('opens the add-skill dialog from the inline Add button', async () => {
		const user = userEvent.setup();
		server.use(
			http.get(`${BASE}/api/skills`, () => HttpResponse.json([mockSkill])),
		);

		renderWithProviders(<SkillsList />);

		await waitFor(() => screen.getByText('TypeScript'));
		await user.click(screen.getByRole('button', { name: /^add$/i }));

		expect(screen.getByRole('dialog')).toBeInTheDocument();
	});
});
