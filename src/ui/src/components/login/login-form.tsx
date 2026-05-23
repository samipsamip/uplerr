import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import { zodResolver } from '@hookform/resolvers/zod/dist/zod.js';

import { authClient } from '@/auth-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
	Field,
	FieldDescription,
	FieldGroup,
	FieldLabel,
	FieldSeparator,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import {
	UserLoginSchema,
	type UserLoginSchemaType,
} from '@/pages/auth/schemas';

export function LoginForm({
	className,
	...props
}: React.ComponentProps<'div'>) {
	const navigate = useNavigate();
	const {
		handleSubmit,
		register,
		formState: { errors, isDirty },
	} = useForm({
		resolver: zodResolver(UserLoginSchema),
	});
	const [buttonDisabled, setButtonDisabled] = useState(false);

	const handleOnSubmit = async (data: UserLoginSchemaType) => {
		await authClient.signIn.email(
			{
				email: data.email,
				password: data.password,
				callbackURL: '/',
			},
			{
				onError: (loginResponse) => {
					toast.error(loginResponse.error.statusText, {
						description: loginResponse.error.message || 'Login failed',
					});
				},
				onSuccess: () => {
					navigate('/dashboard');
				},
			},
		);
	};
	return (
		<div className={cn('flex flex-col gap-6', className)} {...props}>
			<Card className="overflow-hidden p-0">
				<CardContent className="grid p-0 md:grid-cols-2">
					<form
						className="p-6 md:p-8"
						onSubmit={handleSubmit(handleOnSubmit)}
						onChange={() => setButtonDisabled(false)}
					>
						<FieldGroup>
							<div className="flex flex-col items-center gap-1 text-center">
								<h1 className="text-2xl font-bold">Welcome back 👋</h1>
								<p className="text-muted-foreground text-balance text-sm">
									Good to see you again! Enter your details below 🔐
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
									<p className="text-xs text-red-500">
										{errors.email?.message}
									</p>
								)}
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
								<Input
									id="password"
									type="password"
									{...register('password')}
								/>
								{errors.password?.message && (
									<p className="text-xs text-red-500">
										{errors.password?.message}
									</p>
								)}
							</Field>
							<Field>
								<Button type="submit" disabled={!isDirty || buttonDisabled}>
									Login
								</Button>
							</Field>
							<FieldSeparator className="*:data-[slot=field-separator-content]:bg-card">
								Or
							</FieldSeparator>
							<Field>
								<FieldDescription className="text-center">
									Don&apos;t have an account?{' '}
									<a href="/signup" className="underline underline-offset-4">
										Sign up ✨
									</a>
								</FieldDescription>
							</Field>
						</FieldGroup>
					</form>
					<div className="bg-muted relative hidden overflow-hidden md:block">
						<img
							src="/login.png"
							alt="Sidepanel"
							className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
						/>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
