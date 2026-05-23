import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router';

import { PasswordResetConfirm } from '@/components/login/password-reset-confirmation';

export default function PasswordResetConfirmationPage() {
	const location = useLocation();
	const navigate = useNavigate();

	useEffect(() => {
		if (!location.state?.fromForgotPassword) {
			navigate('/forgot-password', { replace: true });
		}
	}, [location.state, navigate]);

	if (!location.state?.fromForgotPassword) return null;

	return (
		<div className="bg-muted flex min-h-svh flex-col items-center justify-center p-6 md:p-10">
			<div className="w-full max-w-xl">
				<PasswordResetConfirm />
			</div>
		</div>
	);
}
