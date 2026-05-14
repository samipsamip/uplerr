import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import {
	ResetPasswordSchema,
	type ResetPasswordSchemaType,
} from '@/pages/auth/schemas';

export function ResetPasswordForm({
	className,
	...props
}: React.ComponentProps<'div'>) {
	const {
		handleSubmit,
		register,
		formState: { errors },
	} = useForm<ResetPasswordSchemaType>({
		resolver: zodResolver(ResetPasswordSchema),
	});
	const currentLocation = window.location.search;
	const token = new URLSearchParams(currentLocation).get('token');
	const errorToken = new URLSearchParams(currentLocation).get('error');

	if (!token || errorToken) {
		return (
			<Card className="overflow-hidden p-0">
				<CardContent className="flex flex-col items-center gap-4 p-8 text-center">
					<img
						src="/forgot-password.png"
						alt="Invalid reset link"
						className="h-48 w-48 object-contain"
					/>
					<h1 className="text-2xl font-bold">Invalid reset link 🔗</h1>
					<p className="text-balance text-sm text-muted-foreground">
						This link is invalid or has expired. Please request a new one.
					</p>
					<a href="/" className="text-sm text-primary">
						Go back to home
					</a>
				</CardContent>
			</Card>
		);
	}

	const onFormSubmit = (_data: ResetPasswordSchemaType) => {
		// Better Auth implementation left to user
	};

	return (
		<div className={cn('flex flex-col gap-6', className)} {...props}>
			<Card className="overflow-hidden p-0">
				<CardContent className="grid p-0 md:grid-cols-2">
					<form className="p-6 md:p-8" onSubmit={handleSubmit(onFormSubmit)}>
						<FieldGroup>
							<div className="flex flex-col items-center gap-1 text-center">
								<h1 className="text-2xl font-bold">Set a new password 🔑</h1>
								<p className="text-balance text-sm text-muted-foreground">
									Choose something strong that you'll remember 💪
								</p>
							</div>
							<Field>
								<FieldLabel htmlFor="password">New password</FieldLabel>
								<Input
									id="password"
									type="password"
									{...register('password')}
								/>
								{errors.password?.message && (
									<p className="text-xs text-destructive">
										{errors.password.message}
									</p>
								)}
							</Field>
							<Field>
								<FieldLabel htmlFor="confirmPassword">
									Confirm new password
								</FieldLabel>
								<Input
									id="confirmPassword"
									type="password"
									{...register('confirmPassword')}
								/>
								{errors.confirmPassword?.message && (
									<p className="text-xs text-destructive">
										{errors.confirmPassword.message}
									</p>
								)}
							</Field>
							<Field>
								<Button type="submit">Reset password 🎉</Button>
							</Field>
						</FieldGroup>
					</form>
					<div className="relative hidden overflow-hidden bg-muted md:block">
						<img
							src="/reset-password.png"
							alt="Sidepanel"
							className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
						/>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
