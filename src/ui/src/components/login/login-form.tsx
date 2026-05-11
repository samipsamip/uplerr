import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
	Field,
	FieldDescription,
	FieldGroup,
	FieldLabel,
	FieldSeparator,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function LoginForm({
	className,
	...props
}: React.ComponentProps<"div">) {
	const handleOnSubmit = (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		const formData = new FormData(e.currentTarget);
		const _email = formData.get("email");
		const _password = formData.get("password");
	};
	return (
		<div className={cn("flex flex-col gap-6", className)} {...props}>
			<Card className="overflow-hidden p-0">
				<CardContent className="grid p-0 md:grid-cols-2">
					<form className="p-6 md:p-8" onSubmit={handleOnSubmit}>
						<FieldGroup>
							<div className="flex flex-col items-center gap-1 text-center">
								<h1 className="text-2xl font-bold">Welcome back 👋</h1>
								<p className="text-balance text-sm text-muted-foreground">
									Good to see you again! Enter your details below 🔐
								</p>
							</div>
							<Field>
								<FieldLabel htmlFor="email">Email</FieldLabel>
								<Input
									id="email"
									type="email"
									placeholder="m@example.com"
									required
								/>
							</Field>
							<Field>
								<div className="flex items-center">
									<FieldLabel htmlFor="password">Password</FieldLabel>
									<a
										href="/forgot-password"
										className="ml-auto text-sm underline-offset-4 hover:underline"
									>
										Forgot your password?
									</a>
								</div>
								<Input id="password" type="password" required />
							</Field>
							<Field>
								<Button type="submit">Login</Button>
							</Field>
							<FieldSeparator className="*:data-[slot=field-separator-content]:bg-card">
								Or
							</FieldSeparator>
							<Field>
								<FieldDescription className="text-center">
									Don&apos;t have an account?{" "}
									<a href="/signup" className="underline underline-offset-4">
										Sign up ✨
									</a>
								</FieldDescription>
							</Field>
						</FieldGroup>
					</form>
					<div className="relative hidden bg-muted md:block">
						<img
							src="/sidepanel-image.png"
							alt="Sidepanel"
							className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
						/>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
