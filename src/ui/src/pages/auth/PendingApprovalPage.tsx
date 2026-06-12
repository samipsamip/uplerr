import { PendingApproval } from '@/components/auth/pending-approval';

export default function PendingApprovalPage() {
	return (
		<div className="bg-muted flex min-h-svh flex-col items-center justify-center p-6 md:p-10">
			<div className="w-full max-w-xl">
				<PendingApproval />
			</div>
		</div>
	);
}
