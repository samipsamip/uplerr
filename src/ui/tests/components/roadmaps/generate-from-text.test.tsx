import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { useForm } from 'react-hook-form';

import GenerateRoadmapFromText from '@/components/roadmaps/generate-from-text';
import type { RoadmapFormValues } from '@/components/roadmaps/create-roadmap-modal';

function Wrapper() {
	const {
		register,
		formState: { errors },
	} = useForm<RoadmapFormValues>();
	return <GenerateRoadmapFromText register={register} errors={errors} />;
}

describe('GenerateRoadmapFromText', () => {
	it('renders the label', () => {
		render(<Wrapper />);
		expect(screen.getByText('Job Description')).toBeInTheDocument();
	});

	it('renders the textarea', () => {
		render(<Wrapper />);
		expect(
			screen.getByPlaceholderText(/paste job description here/i),
		).toBeInTheDocument();
	});

	it('renders the helper text', () => {
		render(<Wrapper />);
		expect(
			screen.getByText(/paste the full job description/i),
		).toBeInTheDocument();
	});

	it('does not show a validation error message when there are no errors', () => {
		render(<Wrapper />);
		expect(screen.queryByText(/please paste/i)).not.toBeInTheDocument();
	});
});
