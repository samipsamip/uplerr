import { zodResolver } from "@hookform/resolvers/zod/dist/zod.js";
import { useForm } from "react-hook-form";
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
import { ForgotPasswordSchema } from "@/pages/auth/schemas";

export function ForgotPasswordForm({
	className,
	...props
}: React.ComponentProps<"div">) {
	const {
		handleSubmit,
		register,
		formState: { errors },
	} = useForm({
		resolver: zodResolver(ForgotPasswordSchema),
	});
	const _handleOnSubmit = (data: any) => console.log(data);
	return (
		<div className={cn("flex flex-col gap-6", className)} {...props}>
			<Card className="overflow-hidden p-0">
				<CardContent className="grid p-0 md:grid-cols-2">
					<form className="p-6 md:p-8" onSubmit={handleSubmit(_handleOnSubmit)}>
						<FieldGroup>
							<div className="flex flex-col items-center gap-1 text-center">
								<h1 className="text-2xl font-bold">Forgot your password? 😅</h1>
								<p className="text-balance text-sm text-muted-foreground">
									No worries, it happens to the best of us! 🤝
								</p>
							</div>
							<Field>
								<FieldLabel htmlFor="email">Email</FieldLabel>
								<Input
									id="email"
									type="email"
									placeholder="m@example.com"
									{...register("email")}
								/>
								{errors.email?.message && (
									<p className="text-xs text-red-500">
										{errors.email?.message}
									</p>
								)}
							</Field>
							<Field>
								<Button type="submit">Send reset link 📬</Button>
							</Field>
							<FieldDescription className="text-center">
								Remember your password?{" "}
								<a href="/" className="underline underline-offset-4">
									Back to login 🔑
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
