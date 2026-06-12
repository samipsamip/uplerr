import { EmailVerified } from '@/components/auth/email-verified';

export default function EmailVerifiedPage() {
	return (
		<div className="bg-muted flex min-h-svh flex-col items-center justify-center p-6 md:p-10">
			<div className="w-full max-w-xl">
				<EmailVerified />
			</div>
		</div>
	);
}
