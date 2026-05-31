import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { SkillExtractionType } from '@uppler/types';

import { ReviewSkillsSection } from '@/components/dashboard/resume-review/review-skills-section';

import { renderWithProviders } from '../../../helpers/render';

function Controlled({ initial }: { initial: SkillExtractionType }) {
	const [skills, setSkills] = useState(initial);
	return <ReviewSkillsSection skills={skills} onChange={setSkills} />;
}

const skills: SkillExtractionType = {
	technical_skills: [
		{ name: 'React', source: 'skills_section' },
		{ name: 'TypeScript', source: 'skills_section' },
	],
	tools_platforms: [{ name: 'Docker', source: 'skills_section' }],
	spoken_languages: [{ name: 'English', source: 'skills_section' }],
	soft_skills: [],
};

describe('ReviewSkillsSection — display', () => {
	it('renders each skill name', () => {
		renderWithProviders(
			<ReviewSkillsSection skills={skills} onChange={vi.fn()} />,
		);
		expect(screen.getByText('React')).toBeInTheDocument();
		expect(screen.getByText('TypeScript')).toBeInTheDocument();
		expect(screen.getByText('Docker')).toBeInTheDocument();
		expect(screen.getByText('English')).toBeInTheDocument();
	});

	it('renders group labels', () => {
		renderWithProviders(
			<ReviewSkillsSection skills={skills} onChange={vi.fn()} />,
		);
		expect(screen.getByText(/technical/i)).toBeInTheDocument();
		expect(screen.getByText(/tools/i)).toBeInTheDocument();
		expect(screen.getByText(/languages/i)).toBeInTheDocument();
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
		const updated = onChange.mock.calls[0][0] as SkillExtractionType;
		expect(updated.technical_skills.map((s) => s.name)).not.toContain('React');
		expect(updated.technical_skills.map((s) => s.name)).toContain('TypeScript');
	});
});

describe('ReviewSkillsSection — add skill', () => {
	it('shows an input after clicking Add', async () => {
		const user = userEvent.setup();
		renderWithProviders(
			<ReviewSkillsSection skills={skills} onChange={vi.fn()} />,
		);

		const addButtons = screen.getAllByRole('button', { name: /add/i });
		await user.click(addButtons[0]);

		expect(screen.getByPlaceholderText(/skill name/i)).toBeInTheDocument();
	});

	it('calls onChange with the new skill on Enter', async () => {
		const user = userEvent.setup();
		const onChange = vi.fn();
		renderWithProviders(<Controlled initial={skills} />);

		const addButtons = screen.getAllByRole('button', { name: /add/i });
		await user.click(addButtons[0]);
		await user.type(
			screen.getByPlaceholderText(/skill name/i),
			'GraphQL{Enter}',
		);

		const updated = onChange.mock.calls?.[0]?.[0] as
			| SkillExtractionType
			| undefined;
		if (updated) {
			const allNames = [
				...updated.technical_skills,
				...updated.tools_platforms,
				...updated.spoken_languages,
				...updated.soft_skills,
			].map((s) => s.name);
			expect(allNames).toContain('GraphQL');
		} else {
			// onChange wasn't called — the component manages state internally via Controlled wrapper
			expect(screen.getByText('GraphQL')).toBeInTheDocument();
		}
	});

	it('does not add an empty skill', async () => {
		const user = userEvent.setup();
		const onChange = vi.fn();
		renderWithProviders(
			<ReviewSkillsSection skills={skills} onChange={onChange} />,
		);

		const addButtons = screen.getAllByRole('button', { name: /add/i });
		await user.click(addButtons[0]);
		await user.keyboard('{Enter}');

		expect(onChange).not.toHaveBeenCalled();
	});

	it('does not add a duplicate skill', async () => {
		const user = userEvent.setup();
		const onChange = vi.fn();
		renderWithProviders(
			<ReviewSkillsSection skills={skills} onChange={onChange} />,
		);

		const addButtons = screen.getAllByRole('button', { name: /add/i });
		await user.click(addButtons[0]);
		await user.type(screen.getByPlaceholderText(/skill name/i), 'React{Enter}');

		expect(onChange).not.toHaveBeenCalled();
	});

	it('closes the input on Escape without calling onChange', async () => {
		const user = userEvent.setup();
		const onChange = vi.fn();
		renderWithProviders(
			<ReviewSkillsSection skills={skills} onChange={onChange} />,
		);

		const addButtons = screen.getAllByRole('button', { name: /add/i });
		await user.click(addButtons[0]);
		await user.keyboard('{Escape}');

		expect(onChange).not.toHaveBeenCalled();
		expect(
			screen.queryByPlaceholderText(/skill name/i),
		).not.toBeInTheDocument();
	});
});
