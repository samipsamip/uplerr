import { createBrowserRouter } from "react-router";
import ForgotPasswordPage from "@/pages/auth/ForgotPasswordPage";
import LoginPage from "@/pages/auth/LoginPage";
import ResetPasswordPage from "@/pages/auth/ResetPasswordPage";
import SignupPage from "@/pages/auth/SignupPage";
import SignupSuccessPage from "@/pages/auth/SignupSuccessPage";
import Dashboard from "@/pages/dashboard/Dashboard";
import ErrorPage from "@/pages/ErrorPage";

export const router = createBrowserRouter([
	{
		errorElement: <ErrorPage />,
		children: [
			{
				path: "/",
				Component: LoginPage,
			},
			{
				path: "/forgot-password",
				Component: ForgotPasswordPage,
			},
			{
				path: "/reset-password",
				Component: ResetPasswordPage,
			},
			{
				path: "/signup",
				Component: SignupPage,
			},
			{
				path: "/signup/success",
				Component: SignupSuccessPage,
			},
			{
				path: "/dashboard",
				Component: Dashboard,
			},
			{
				path: "*",
				Component: ErrorPage,
			},
		],
	},
]);
