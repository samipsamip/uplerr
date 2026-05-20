export function Fallback() {
	return (
		<div className="flex min-h-svh flex-col items-center justify-center gap-4 bg-muted">
			<div className="h-8 w-8 animate-spin rounded-full border-4 border-muted-foreground border-t-primary" />
			<p className="text-sm text-muted-foreground">Hang tight, loading... ⏳</p>
		</div>
	);
}
