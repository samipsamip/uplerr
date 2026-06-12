import { Card, CardContent } from '@/components/ui/card';

export function PendingApproval() {
	return (
		<Card>
			<CardContent className="flex flex-col items-center gap-8 px-10 py-12 text-center">
				<span className="text-6xl">⏳</span>
				<div className="flex flex-col gap-3">
					<h1 className="text-3xl font-bold">Approval Pending</h1>
					<p className="text-muted-foreground text-balance">
						Your account is under review. We'll send you an email once you've
						been approved.
					</p>
				</div>
				<div className="border-border w-full border-t" />
				<p className="text-muted-foreground text-sm">
					<a href="/login" className="underline underline-offset-4">
						Back to login
					</a>
				</p>
			</CardContent>
		</Card>
	);
}
