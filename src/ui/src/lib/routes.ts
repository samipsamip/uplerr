import { createBrowserRouter } from "react-router";
import ForgotPasswordPage from "@/pages/auth/ForgotPasswordPage";
import LoginPage from "@/pages/auth/LoginPage";
import SignupPage from "@/pages/auth/SignupPage";
import SignupSuccessPage from "@/pages/auth/SignupSuccessPage";
import Dashboard from "@/pages/dashboard/Dashboard";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: LoginPage,
  },
  {
    path: "/forgot-password",
    Component: ForgotPasswordPage,
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
]);
