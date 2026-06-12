import type { RouteObject } from 'react-router';
import {
	createBrowserRouter,
	Outlet,
	redirect,
	useLoaderData,
} from 'react-router';
import ky, { HTTPError } from 'ky';

import { Fallback } from '@/components/ui/fallback';
import ForgotPasswordPage from '@/pages/auth/ForgotPasswordPage';
import LoginPage from '@/pages/auth/LoginPage';
import PasswordResetConfirmationPage from '@/pages/auth/PasswordResetConfirmationPage';
import PasswordResetSuccessPage from '@/pages/auth/PasswordResetSuccessPage';
import ResetPasswordPage from '@/pages/auth/ResetPasswordPage';
import SignupPage from '@/pages/auth/SignupPage';
import SignupSuccessPage from '@/pages/auth/SignupSuccessPage';
import Dashboard from '@/pages/dashboard/Dashboard';
import Roadmaps from '@/pages/dashboard/Roadmaps';
import RoadmapView from '@/pages/dashboard/RoadmapView';
import Skills from '@/pages/dashboard/Skills';
import SkillsReview from '@/pages/dashboard/SkillsReview';
import ErrorPage from '@/pages/ErrorPage';

let _sessionCache: { value: unknown; expiresAt: number } | null = null;

const getSession = async () => {
	const now = Date.now();
	if (_sessionCache && now < _sessionCache.expiresAt) {
		return _sessionCache.value;
	}
	try {
		const value = await ky
			.get(`${import.meta.env.VITE_API_URL ?? 'http://localhost:3000'}/me`, {
				credentials: 'include',
			})
			.json();
		_sessionCache = { value, expiresAt: now + 30_000 };
		return value;
	} catch (err) {
		_sessionCache = null;
		if (err instanceof HTTPError && err.response.status === 403) {
			const body = await err.response.json().catch(() => ({}));
			if (
				typeof body === 'object' &&
				body !== null &&
				'code' in body &&
				body.code === 'PENDING_APPROVAL'
			) {
				return 'PENDING_APPROVAL' as const;
			}
		}
		return false;
	}
};

export const invalidateSessionCache = () => {
	_sessionCache = null;
};

/**
 * / → decide initial landing page
 */
const rootLoader = async () => {
	const authenticated = await getSession();
	if (authenticated) {
		throw redirect('/dashboard');
	}

	throw redirect('/login');
};

/**
 * Protect private routes
 */
const requireAuth = async () => {
	const session = await getSession();
	if (session === 'PENDING_APPROVAL') {
		throw redirect('/login?reason=pending_approval');
	}
	if (!session) {
		throw redirect('/login');
	}
	return session;
};

/* ---------------------------------- */
/* Layout                            */
/* ---------------------------------- */

function ProtectedLayout() {
	return <Outlet context={useLoaderData()} />;
}

const publicRoutes: RouteObject[] = [
	{
		path: '/login',
		Component: LoginPage,
	},
	{
		path: '/signup',
		Component: SignupPage,
	},
	{
		path: '/forgot-password',
		Component: ForgotPasswordPage,
	},
	{
		path: '/forgot-password/confirmation',
		Component: PasswordResetConfirmationPage,
	},
	{
		path: '/reset-password',
		Component: ResetPasswordPage,
	},
	{
		path: '/reset-password/success',
		Component: PasswordResetSuccessPage,
	},
	{
		path: '/signup/success',
		Component: SignupSuccessPage,
	},
];

const privateRoutes: RouteObject[] = [
	{
		path: '/',
		loader: requireAuth,
		Component: ProtectedLayout,
		HydrateFallback: Fallback,
		children: [
			{
				path: 'dashboard',
				index: true,
				Component: Dashboard,
			},
			{
				path: 'roadmaps',
				Component: Roadmaps,
			},
			{
				path: 'roadmaps/view/:planId',
				Component: RoadmapView,
			},
			{
				path: 'skills',
				Component: Skills,
			},
			{
				path: 'skills/review',
				Component: SkillsReview,
			},
		],
	},
];

export const router = createBrowserRouter([
	{
		path: '/',
		loader: rootLoader,
		Component: () => null, // This component won't render since rootLoader will redirect
	},

	{
		errorElement: <ErrorPage />,
		HydrateFallback: Fallback,
		children: [
			...publicRoutes,
			...privateRoutes,

			{
				path: '*',
				Component: ErrorPage,
			},
		],
	},
]);
