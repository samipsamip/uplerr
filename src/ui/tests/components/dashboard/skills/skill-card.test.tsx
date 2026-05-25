import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { UserSkill } from '@uppler/types';

import { SkillCard } from '@/components/dashboard/skills/skill-card';

import { renderWithProviders } from '../../../helpers/render';

const skill: UserSkill = {
	id: 'skill-1',
	name: 'TypeScript',
	category: 'Frontend',
	level: 'expert',
	source: 'manual',
};

describe('SkillCard', () => {
	it('renders the skill name', () => {
		renderWithProviders(<SkillCard skill={skill} />);

		expect(screen.getByText('TypeScript')).toBeInTheDocument();
	});

	it('renders the level label', () => {
		renderWithProviders(<SkillCard skill={skill} />);

		expect(screen.getByText('Expert')).toBeInTheDocument();
	});

	it('renders level labels for each level value', () => {
		const levels: Array<{ level: UserSkill['level']; label: string }> = [
			{ level: 'beginner', label: 'Beginner' },
			{ level: 'intermediate', label: 'Intermediate' },
			{ level: 'advanced', label: 'Advanced' },
			{ level: 'expert', label: 'Expert' },
		];

		for (const { level, label } of levels) {
			const { unmount } = renderWithProviders(
				<SkillCard skill={{ ...skill, level }} />,
			);
			expect(screen.getByText(label)).toBeInTheDocument();
			unmount();
		}
	});

	it('has an edit button accessible by aria-label', () => {
		renderWithProviders(<SkillCard skill={skill} />);

		expect(
			screen.getByRole('button', { name: /edit typescript/i }),
		).toBeInTheDocument();
	});

	it('opens the edit dialog when the edit button is clicked', async () => {
		const user = userEvent.setup();
		renderWithProviders(<SkillCard skill={skill} />);

		await user.click(screen.getByRole('button', { name: /edit typescript/i }));

		expect(screen.getByRole('dialog')).toBeInTheDocument();
		expect(
			screen.getByRole('heading', { name: /edit skill/i }),
		).toBeInTheDocument();
	});
});
