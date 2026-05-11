import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
	Field,
	FieldDescription,
	FieldGroup,
	FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function SignupForm({
	className,
	...props
}: React.ComponentProps<"div">) {
	return (
		<div className={cn("flex flex-col gap-6", className)} {...props}>
			<Card className="overflow-hidden p-0">
				<CardContent className="grid p-0 md:grid-cols-2">
					<form className="p-6 md:p-8">
						<FieldGroup>
							<div className="flex flex-col items-center gap-1 text-center">
								<h1 className="text-2xl font-bold">Let's get you started 🚀</h1>
								<p className="text-balance text-sm text-muted-foreground">
									Create your account and let&apos;s build your lesson plan! 🎉
								</p>
							</div>
							<div className="grid grid-cols-2 gap-4">
								<Field>
									<FieldLabel htmlFor="firstName">First name</FieldLabel>
									<Input
										id="firstName"
										type="text"
										placeholder="John"
										required
									/>
								</Field>
								<Field>
									<FieldLabel htmlFor="lastName">Last name</FieldLabel>
									<Input id="lastName" type="text" placeholder="Doe" required />
								</Field>
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
								<FieldLabel htmlFor="password">Password</FieldLabel>
								<Input id="password" type="password" required />
							</Field>
							<Field>
								<FieldLabel htmlFor="confirmPassword">
									Confirm password
								</FieldLabel>
								<Input id="confirmPassword" type="password" required />
							</Field>
							<Field>
								<Button type="submit">Create account 🎊</Button>
							</Field>
							<FieldDescription className="text-center">
								Already have an account?{" "}
								<a href="/" className="underline underline-offset-4">
									Login 👋
								</a>
							</FieldDescription>
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
