import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import { zodResolver } from '@hookform/resolvers/zod/dist/zod.js';

import { authClient } from '@/auth-client';
import { AuthFormShell } from '@/components/auth/auth-form-shell';
import { Button } from '@/components/ui/button';
import {
	Field,
	FieldDescription,
	FieldGroup,
	FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import {
	ForgotPasswordSchema,
	type ForgotPasswordSchemaType,
} from '@/pages/auth/schemas';

export function ForgotPasswordForm({
	className,
	...props
}: React.ComponentProps<'div'>) {
	const {
		handleSubmit,
		register,
		formState: { errors },
	} = useForm({
		resolver: zodResolver(ForgotPasswordSchema),
	});
	const navigate = useNavigate();
	const [buttonDisabled, setButtonDisabled] = useState(false);

	const handleOnSubmit = (data: ForgotPasswordSchemaType) => {
		authClient.requestPasswordReset(
			{
				email: data.email,
				redirectTo: 'http://localhost:5173/reset-password',
			},
			{
				onSuccess: () => {
					setButtonDisabled(true);
					toast.success(
						`Please check your email for password reset instructions`,
					);
					navigate('/forgot-password/confirmation', {
						state: { fromForgotPassword: true },
					});
				},
				onError: () => {
					toast.error(`Something went wrong, please try again later!`);
				},
			},
		);
	};

	const handleFieldChanges = () => {
		setButtonDisabled(false);
	};

	return (
		<AuthFormShell
			imageSrc="/forgot-password.png"
			imageAlt="Sidepanel"
			className={cn(className)}
			{...props}
		>
			<form
				onSubmit={handleSubmit(handleOnSubmit)}
				onChange={handleFieldChanges}
			>
				<FieldGroup>
					<div className="flex flex-col items-center gap-1 text-center">
						<h1 className="text-2xl font-bold">Forgot your password? 😅</h1>
						<p className="text-muted-foreground text-balance text-sm">
							No worries, it happens to the best of us! 🤝
						</p>
					</div>
					<Field>
						<FieldLabel htmlFor="email">Email</FieldLabel>
						<Input
							id="email"
							type="email"
							placeholder="m@example.com"
							{...register('email')}
						/>
						{errors.email?.message && (
							<p className="text-destructive text-xs">
								{errors.email?.message}
							</p>
						)}
					</Field>
					<Field>
						<Button type="submit" disabled={buttonDisabled}>
							Send reset link 📬
						</Button>
					</Field>
					<FieldDescription className="text-center">
						Remember your password?{' '}
						<a href="/" className="underline underline-offset-4">
							Back to login 🔑
						</a>
					</FieldDescription>
				</FieldGroup>
			</form>
		</AuthFormShell>
	);
}
