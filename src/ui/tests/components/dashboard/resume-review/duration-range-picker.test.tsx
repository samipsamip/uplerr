import { describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { DurationRangePicker } from '@/components/dashboard/resume-review/duration-range-picker';

import { renderWithProviders } from '../../../helpers/render';

describe('DurationRangePicker — display', () => {
	it('shows "Select duration" when no value is provided', () => {
		renderWithProviders(
			<DurationRangePicker value={undefined} onChange={vi.fn()} />,
		);
		expect(screen.getByText('Select duration')).toBeInTheDocument();
	});

	it('shows the value string when a value is provided', () => {
		renderWithProviders(
			<DurationRangePicker value="Jan 2020 – Mar 2023" onChange={vi.fn()} />,
		);
		expect(screen.getByText('Jan 2020 – Mar 2023')).toBeInTheDocument();
	});

	it('shows a present range string', () => {
		renderWithProviders(
			<DurationRangePicker value="Jan 2022 – Present" onChange={vi.fn()} />,
		);
		expect(screen.getByText('Jan 2022 – Present')).toBeInTheDocument();
	});
});

describe('DurationRangePicker — popover', () => {
	it('opens the calendar popover when the trigger is clicked', async () => {
		const user = userEvent.setup();
		renderWithProviders(
			<DurationRangePicker value={undefined} onChange={vi.fn()} />,
		);

		await user.click(screen.getByRole('button'));

		await waitFor(() => {
			expect(screen.getByText(/currently working here/i)).toBeInTheDocument();
		});
	});

	it('calls onChange with a Present end when "Currently working here" is toggled on', async () => {
		const user = userEvent.setup();
		const onChange = vi.fn();
		renderWithProviders(
			<DurationRangePicker value="Jan 2022 – Mar 2024" onChange={onChange} />,
		);

		await user.click(screen.getByRole('button'));
		await waitFor(() => screen.getByText(/currently working here/i));

		const checkbox = screen.getByRole('checkbox', {
			name: /currently working here/i,
		});
		await user.click(checkbox);

		await waitFor(() => {
			expect(onChange).toHaveBeenCalled();
			const lastCall = onChange.mock.calls.at(-1)?.[0] as string | undefined;
			expect(lastCall).toMatch(/present/i);
		});
	});

	it('calls onChange removing Present when "Currently working here" is toggled off', async () => {
		const user = userEvent.setup();
		const onChange = vi.fn();
		renderWithProviders(
			<DurationRangePicker value="Jan 2022 – Present" onChange={onChange} />,
		);

		await user.click(screen.getByRole('button'));
		await waitFor(() => screen.getByText(/currently working here/i));

		const checkbox = screen.getByRole('checkbox', {
			name: /currently working here/i,
		});
		expect(checkbox).toHaveAttribute('data-state', 'checked');

		await user.click(checkbox);

		await waitFor(() => {
			expect(onChange).toHaveBeenCalled();
			const lastCall = onChange.mock.calls.at(-1)?.[0] as string | undefined;
			expect(lastCall).not.toMatch(/present/i);
		});
	});
});
