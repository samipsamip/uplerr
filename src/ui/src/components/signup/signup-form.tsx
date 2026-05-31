import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import { zodResolver } from '@hookform/resolvers/zod';

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
	UserSignupSchema,
	type UserSignupSchemaType,
} from '@/pages/auth/schemas';

export function SignupForm({
	className,
	...props
}: React.ComponentProps<'div'>) {
	const _navigate = useNavigate();
	const {
		handleSubmit,
		register,
		formState: { errors },
	} = useForm({
		resolver: zodResolver(UserSignupSchema),
	});

	const onFormSubmit = async (data: UserSignupSchemaType) => {
		await authClient.signUp.email(
			{
				name: `${data.firstName} ${data.lastName}`,
				email: data.email,
				password: data.password,
				callbackURL: 'http://localhost:5173/dashboard',
			},
			{
				onSuccess: () => {
					_navigate('/signup/success', {
						state: { fromSignup: true },
					});
				},
				onError: () => {
					toast.error(`Signup failed , please try again later!`);
				},
			},
		);
	};

	return (
		<AuthFormShell
			imageSrc="/sign-up.png"
			imageAlt="Sidepanel"
			className={cn(className)}
			{...props}
		>
			<form onSubmit={handleSubmit(onFormSubmit)}>
				<FieldGroup>
					<div className="flex flex-col items-center gap-1 text-center">
						<h1 className="text-2xl font-bold">Let's get you started 🚀</h1>
						<p className="text-muted-foreground text-balance text-sm">
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
								{...register('firstName')}
							/>
							{errors.firstName?.message && (
								<p className="text-destructive text-xs">
									{errors.firstName?.message}
								</p>
							)}
						</Field>
						<Field>
							<FieldLabel htmlFor="lastName">Last name</FieldLabel>
							<Input
								id="lastName"
								type="text"
								placeholder="Doe"
								{...register('lastName')}
							/>
							{errors.lastName?.message && (
								<p className="text-destructive text-xs">
									{errors.lastName?.message}
								</p>
							)}
						</Field>
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
						<FieldLabel htmlFor="password">Password</FieldLabel>
						<Input id="password" type="password" {...register('password')} />
						{errors.password?.message && (
							<p className="text-destructive text-xs">
								{errors.password?.message}
							</p>
						)}
					</Field>
					<Field>
						<FieldLabel htmlFor="confirmPassword">Confirm password</FieldLabel>
						<Input
							id="confirmPassword"
							type="password"
							{...register('confirmPassword')}
						/>
						{errors.confirmPassword?.message && (
							<p className="text-destructive text-xs">
								{errors.confirmPassword?.message}
							</p>
						)}
					</Field>
					<Field>
						<Button type="submit">Create account 🎊</Button>
					</Field>
					<FieldDescription className="text-center">
						Already have an account?{' '}
						<a href="/" className="underline underline-offset-4">
							Login 👋
						</a>
					</FieldDescription>
				</FieldGroup>
			</form>
		</AuthFormShell>
	);
}
