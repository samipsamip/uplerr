import type { RouteObject } from 'react-router';
import {
	createBrowserRouter,
	Outlet,
	redirect,
	useLoaderData,
} from 'react-router';
import ky from 'ky';

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
import Skills from '@/pages/dashboard/Skills';
import ErrorPage from '@/pages/ErrorPage';

const getSession = async () => {
	try {
		const response = await ky
			.get('http://localhost:3000/me', {
				credentials: 'include',
			})
			.json();
		return response;
	} catch {
		return false;
	}
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
	const authenticated = await getSession();
	if (!authenticated) {
		throw redirect('/login');
	}
	return authenticated;
};

/**
 * Block logged-in users from auth pages
 */
const requireGuest = async () => {
	const authenticated = await getSession();

	if (authenticated) {
		throw redirect('/dashboard');
	}

	return null;
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
		loader: requireGuest,
		Component: LoginPage,
	},
	{
		path: '/signup',
		loader: requireGuest,
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
				path: 'skills',
				Component: Skills,
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
