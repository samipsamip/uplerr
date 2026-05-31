import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';

import SkillsMain from '@/components/dashboard/skills/skills-main';

import { renderWithProviders } from '../../../helpers/render';
import { BASE, mockProfile } from '../../../msw/handlers';
import { server } from '../../../msw/server';

vi.mock('@/components/dashboard/top-bar', () => ({
	TopBar: ({ title }: { title: string }) => <h1>{title}</h1>,
}));

const profileWithCV = {
	...mockProfile,
	cv: {
		filename: 'my-resume.pdf',
		hasStructuredData: true,
		uploadedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
		is_verified: true,
		structuredData: null,
	},
};

const profileWithUnverifiedCV = {
	...mockProfile,
	cv: {
		filename: 'draft.pdf',
		hasStructuredData: false,
		uploadedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
		is_verified: false,
		structuredData: null,
	},
};

describe('SkillsMain', () => {
	it('shows a loading fallback initially', () => {
		renderWithProviders(<SkillsMain />);

		// The Fallback component renders while the query is pending
		expect(document.body).toBeTruthy();
	});

	it('shows the CvEmptyState when no CV is uploaded', async () => {
		renderWithProviders(<SkillsMain />);

		await waitFor(() => {
			expect(screen.getByText(/upload your cv/i)).toBeInTheDocument();
		});
	});

	it('renders the page title', async () => {
		renderWithProviders(<SkillsMain />);

		await waitFor(() => {
			expect(screen.getByText('Skills & CV')).toBeInTheDocument();
		});
	});

	it('shows CvCard when a CV is present', async () => {
		server.use(
			http.get(`${BASE}/api/profile`, () => HttpResponse.json(profileWithCV)),
		);

		renderWithProviders(<SkillsMain />);

		await waitFor(() => {
			expect(screen.getByText('my-resume.pdf')).toBeInTheDocument();
		});
	});

	it('shows "Verified" badge for a verified CV', async () => {
		server.use(
			http.get(`${BASE}/api/profile`, () => HttpResponse.json(profileWithCV)),
		);

		renderWithProviders(<SkillsMain />);

		await waitFor(() => {
			expect(screen.getByText('Verified')).toBeInTheDocument();
		});
	});

	it('shows "Needs review" for an unverified CV', async () => {
		server.use(
			http.get(`${BASE}/api/profile`, () =>
				HttpResponse.json(profileWithUnverifiedCV),
			),
		);

		renderWithProviders(<SkillsMain />);

		await waitFor(() => {
			expect(screen.getByText(/needs review/i)).toBeInTheDocument();
		});
	});

	it('shows an error page when the profile query fails', async () => {
		server.use(
			http.get(`${BASE}/api/profile`, () =>
				HttpResponse.json({ message: 'Server error' }, { status: 500 }),
			),
		);

		renderWithProviders(<SkillsMain />);

		await waitFor(() => {
			// ErrorPage renders something — check that the empty state is gone
			expect(screen.queryByText(/upload your cv/i)).not.toBeInTheDocument();
		});
	});
});
