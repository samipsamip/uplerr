import { screen } from '@testing-library/react';
import { render } from '@testing-library/react';
import { useForm } from 'react-hook-form';
import { describe, expect, it } from 'vitest';

import type { RoadmapFormValues } from '@/components/roadmaps/create-roadmap-modal';
import GenerateRoadmapFromURL from '@/components/roadmaps/generate-from-url';

function Wrapper() {
	const {
		register,
		formState: { errors },
	} = useForm<RoadmapFormValues>();
	return <GenerateRoadmapFromURL register={register} errors={errors} />;
}

describe('GenerateRoadmapFromURL', () => {
	it('renders the label', () => {
		render(<Wrapper />);
		expect(screen.getByText('Job Listing URL')).toBeInTheDocument();
	});

	it('renders the URL input', () => {
		render(<Wrapper />);
		expect(screen.getByPlaceholderText('https://...')).toBeInTheDocument();
	});

	it('renders the helper text', () => {
		render(<Wrapper />);
		expect(
			screen.getByText(/extract the description automatically/i),
		).toBeInTheDocument();
	});

	it('does not show an error message when there are no errors', () => {
		render(<Wrapper />);
		expect(screen.queryByText(/please enter/i)).not.toBeInTheDocument();
	});
});
