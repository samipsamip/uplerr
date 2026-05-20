import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { PasswordResetSuccess } from '@/components/login/password-reset-success';

export default function PasswordResetSuccessPage() {
	const location = useLocation();
	const navigate = useNavigate();

	useEffect(() => {
		if (!location.state?.fromPasswordReset) {
			navigate('/', { replace: true });
		}
	}, [location.state, navigate]);

	if (!location.state?.fromPasswordReset) return null;

	return (
		<div className="flex min-h-svh flex-col items-center justify-center bg-muted p-6 md:p-10">
			<div className="w-full max-w-xl">
				<PasswordResetSuccess />
			</div>
		</div>
	);
}
