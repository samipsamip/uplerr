import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { Card, CardContent } from '@/components/ui/card';
export function SignupSuccess() {
	const location = useLocation();
	const navigate = useNavigate();

	useEffect(() => {
		if (!location.state?.fromSignup) {
			navigate('/signup', { replace: true });
		}
	}, [location.state, navigate]);

	if (!location.state?.fromSignup) return null;

	return (
		<Card>
				<CardContent className="flex flex-col items-center gap-8 px-10 py-12 text-center">
					<span className="text-6xl">🎉</span>
					<div className="flex flex-col gap-3">
						<h1 className="text-3xl font-bold">You're almost in!</h1>
						<p className="text-balance text-muted-foreground">
							We've sent a verification link to your email address.
						</p>
						<p className="text-balance text-muted-foreground">
							Check your inbox and click the link to activate your account. 📬
						</p>
					</div>
					<div className="w-full border-t border-border" />
					<p className="text-sm text-muted-foreground">
						Didn't receive it? Check your spam folder or{' '}
						<a href="/signup" className="underline underline-offset-4">
							try again
						</a>
						.
					</p>
				</CardContent>
		</Card>
	);
}
