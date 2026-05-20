import { Card, CardContent } from '@/components/ui/card';

export function PasswordResetConfirm() {
	return (
		<Card className="overflow-hidden p-0">
			<CardContent className="flex flex-col items-center gap-6 p-8 text-center">
				<img
					src="/forgot-password.png"
					alt="Check your email"
					className="h-48 w-48 object-contain"
				/>
				<div className="flex flex-col gap-3">
					<h1 className="text-2xl font-bold">Check your inbox 📬</h1>
					<p className="text-balance text-muted-foreground">
						We've sent a password reset link to your email address. Click the
						link to set a new password.
					</p>
				</div>
				<div className="w-full border-t border-border" />
				<p className="text-sm text-muted-foreground">
					Didn't receive it? Check your spam folder or{' '}
					<a href="/forgot-password" className="underline underline-offset-4">
						try again
					</a>
					.
				</p>
			</CardContent>
		</Card>
	);
}
