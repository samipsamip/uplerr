import { SignupSuccess } from '@/components/signup/signup-success';

export default function SignupSuccessPage() {
	return (
		<div className="flex min-h-svh flex-col items-center justify-center bg-muted p-6 md:p-10">
			<div className="w-full max-w-xl">
				<SignupSuccess />
			</div>
		</div>
	);
}
