export function Fallback() {
	return (
		<div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-background">
			<div className="h-7 w-7 animate-spin rounded-full border-[3px] border-border border-t-accent" />
			<p className="text-sm text-muted-foreground">Loading...</p>
		</div>
	);
}
