import { Card, CardContent } from '@/components/ui/card';

export function PasswordResetSuccess() {
	return (
		<Card className="overflow-hidden p-0">
			<CardContent className="flex flex-col items-center gap-6 p-8 text-center">
				<img
					src="/reset-password.png"
					alt="Password reset success"
					className="h-48 w-48 object-contain"
				/>
				<div className="flex flex-col gap-3">
					<h1 className="text-2xl font-bold">Password updated! 🎉</h1>
					<p className="text-balance text-muted-foreground">
						Your password has been reset successfully. You can now log in with
						your new password.
					</p>
				</div>
				<a
					href="/"
					className="text-sm font-medium underline underline-offset-4 hover:text-primary"
				>
					Back to login 🔑
				</a>
			</CardContent>
		</Card>
	);
}
