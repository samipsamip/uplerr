import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import { zodResolver } from '@hookform/resolvers/zod';

import { authClient } from '@/auth-client';
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
	const navigate = useNavigate();
	const [hasTokenError, setHasTokenError] = useState(false);

	if (!token || errorToken || hasTokenError) {
		return (
			<Card className="overflow-hidden p-0">
				<CardContent className="flex flex-col items-center gap-4 p-8 text-center">
					<img
						src="/forgot-password.png"
						alt="Invalid reset link"
						className="h-48 w-48 object-contain"
					/>
					<h1 className="text-2xl font-bold">Invalid reset link 🔗</h1>
					<p className="text-muted-foreground text-balance text-sm">
						This link is invalid or has expired. Please request a new one.
					</p>
					<a href="/" className="text-primary text-sm">
						Go back to home
					</a>
				</CardContent>
			</Card>
		);
	}

	const onFormSubmit = async (data: ResetPasswordSchemaType) => {
		const { password: newPassword } = data;
		await authClient.resetPassword(
			{
				newPassword,
				token,
			},
			{
				onSuccess: () => {
					toast.success(
						'Password reset successful! You can now log in with your new password.',
					);
					navigate('/');
				},
				onError: () => {
					toast.error(`Something went wrong, please try again later!`);
					setHasTokenError(true);
				},
			},
		);
	};

	return (
		<div className={cn('flex flex-col gap-6', className)} {...props}>
			<Card className="overflow-hidden p-0">
				<CardContent className="grid p-0 md:grid-cols-2">
					<form className="p-6 md:p-8" onSubmit={handleSubmit(onFormSubmit)}>
						<FieldGroup>
							<div className="flex flex-col items-center gap-1 text-center">
								<h1 className="text-2xl font-bold">Set a new password 🔑</h1>
								<p className="text-muted-foreground text-balance text-sm">
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
									<p className="text-destructive text-xs">
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
									<p className="text-destructive text-xs">
										{errors.confirmPassword.message}
									</p>
								)}
							</Field>
							<Field>
								<Button type="submit" disabled={Object.keys(errors).length > 0}>
									Reset password 🎉
								</Button>
							</Field>
						</FieldGroup>
					</form>
					<div className="bg-muted relative hidden overflow-hidden md:block">
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
