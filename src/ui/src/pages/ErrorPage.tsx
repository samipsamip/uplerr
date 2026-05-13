import { isRouteErrorResponse, Link, useRouteError } from 'react-router';

export default function ErrorPage() {
	const error = useRouteError();
	const is404 = isRouteErrorResponse(error) && error.status === 404;

	return (
		<div className="flex min-h-svh flex-col items-center justify-center bg-muted p-6 md:p-10">
			<div className="flex flex-col items-center gap-6 text-center">
				<img src="/404-icon.png" alt="404 robot" className="h-72 w-72 object-contain" />
				<div className="flex flex-col gap-3">
					<h1 className="text-3xl font-bold">
						{is404 ? "You've hit a dead end 🤖" : 'Uh oh, something broke 😬'}
					</h1>
					<p className="text-balance text-muted-foreground">
						{is404
							? "This page doesn't exist — the robot looked everywhere and came up empty."
							: "An unexpected error occurred on our end. It's not you, it's us."}
					</p>
				</div>
				<Link
					to="/"
					className="text-sm font-medium underline underline-offset-4 hover:text-primary"
				>
					Head back to safety 🏠
				</Link>
			</div>
		</div>
	);
}
