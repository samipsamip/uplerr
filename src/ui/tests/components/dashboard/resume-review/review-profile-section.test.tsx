import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ReviewProfileSection } from '@/components/dashboard/resume-review/review-profile-section';

import { renderWithProviders } from '../../../helpers/render';

const baseData = {
	full_name: 'Alice Johnson',
	contact_details: {
		email: 'alice@example.com',
		phone: '0400000000',
		location: 'Sydney, AU',
		linkedin: 'https://linkedin.com/in/alice',
		vcs_platform: 'GitHub' as const,
		vcs_url: 'https://github.com/alice',
		portfolio: 'https://alice.dev',
	},
};

describe('ReviewProfileSection — display', () => {
	it('renders the name', () => {
		renderWithProviders(
			<ReviewProfileSection data={baseData} onChange={vi.fn()} />,
		);
		expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
	});

	it('renders email, phone, and location', () => {
		renderWithProviders(
			<ReviewProfileSection data={baseData} onChange={vi.fn()} />,
		);
		expect(screen.getByText('alice@example.com')).toBeInTheDocument();
		expect(screen.getByText('0400000000')).toBeInTheDocument();
		expect(screen.getByText('Sydney, AU')).toBeInTheDocument();
	});

	it('renders the LinkedIn URL', () => {
		renderWithProviders(
			<ReviewProfileSection data={baseData} onChange={vi.fn()} />,
		);
		expect(
			screen.getByText('https://linkedin.com/in/alice'),
		).toBeInTheDocument();
	});

	it('renders the VCS URL', () => {
		renderWithProviders(
			<ReviewProfileSection data={baseData} onChange={vi.fn()} />,
		);
		expect(screen.getByText('https://github.com/alice')).toBeInTheDocument();
	});

	it('shows placeholder text for missing email', () => {
		renderWithProviders(
			<ReviewProfileSection
				data={{
					...baseData,
					contact_details: { ...baseData.contact_details, email: null },
				}}
				onChange={vi.fn()}
			/>,
		);
		expect(screen.getByText(/add email/i)).toBeInTheDocument();
	});

	it('shows placeholder text for missing LinkedIn', () => {
		renderWithProviders(
			<ReviewProfileSection
				data={{
					...baseData,
					contact_details: { ...baseData.contact_details, linkedin: null },
				}}
				onChange={vi.fn()}
			/>,
		);
		expect(screen.getByText(/add linkedin/i)).toBeInTheDocument();
	});
});

describe('ReviewProfileSection — EditableField interactions', () => {
	it('switches the name to an input when clicked', async () => {
		const user = userEvent.setup();
		renderWithProviders(
			<ReviewProfileSection data={baseData} onChange={vi.fn()} />,
		);

		await user.click(screen.getByText('Alice Johnson'));

		expect(screen.getByDisplayValue('Alice Johnson')).toBeInTheDocument();
	});

	it('calls onChange with the updated name on Enter', async () => {
		const user = userEvent.setup();
		const onChange = vi.fn();
		renderWithProviders(
			<ReviewProfileSection data={baseData} onChange={onChange} />,
		);

		await user.click(screen.getByText('Alice Johnson'));
		const input = screen.getByDisplayValue('Alice Johnson');
		await user.clear(input);
		await user.type(input, 'Bob{Enter}');

		expect(onChange).toHaveBeenCalledOnce();
		expect(onChange.mock.calls[0][0]).toMatchObject({ full_name: 'Bob' });
	});

	it('reverts to original value on Escape', async () => {
		const user = userEvent.setup();
		const onChange = vi.fn();
		renderWithProviders(
			<ReviewProfileSection data={baseData} onChange={onChange} />,
		);

		await user.click(screen.getByText('Alice Johnson'));
		const input = screen.getByDisplayValue('Alice Johnson');
		await user.clear(input);
		await user.type(input, 'Partial name');
		await user.keyboard('{Escape}');

		expect(onChange).not.toHaveBeenCalled();
		expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
	});
});
