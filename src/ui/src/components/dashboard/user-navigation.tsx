'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router';
import {
	BadgeCheck,
	ChevronsUpDown,
	Eye,
	EyeOff,
	Loader2,
	LogOut,
} from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

import { authClient } from '@/auth-client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Field, FieldError, FieldGroup } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	useSidebar,
} from '@/components/ui/sidebar';
import { invalidateSessionCache } from '@/lib/routes';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getInitials(name: string) {
	return name
		.split(' ')
		.map((n) => n[0])
		.join('')
		.toUpperCase()
		.slice(0, 2);
}

// ---------------------------------------------------------------------------
// Change-password form schema
// ---------------------------------------------------------------------------

const changePasswordSchema = z
	.object({
		currentPassword: z.string().min(1, 'Current password is required'),
		newPassword: z
			.string()
			.min(8, 'New password must be at least 8 characters'),
		confirmPassword: z.string().min(1, 'Please confirm your new password'),
	})
	.refine((d) => d.newPassword === d.confirmPassword, {
		message: "Passwords don't match",
		path: ['confirmPassword'],
	});

type ChangePasswordValues = z.infer<typeof changePasswordSchema>;

// ---------------------------------------------------------------------------
// Account modal
// ---------------------------------------------------------------------------

function AccountModal({
	open,
	onOpenChange,
	user,
}: {
	open: boolean;
	onOpenChange: (v: boolean) => void;
	user: { name: string; email: string; avatar?: string };
}) {
	const [showCurrent, setShowCurrent] = useState(false);
	const [showNew, setShowNew] = useState(false);
	const [showConfirm, setShowConfirm] = useState(false);

	const {
		register,
		handleSubmit,
		reset,
		formState: { errors, isSubmitting },
	} = useForm<ChangePasswordValues>({
		resolver: zodResolver(changePasswordSchema),
	});

	const onClose = (next: boolean) => {
		if (!next) reset();
		onOpenChange(next);
	};

	const onSubmit = async (values: ChangePasswordValues) => {
		const { error } = await authClient.changePassword({
			currentPassword: values.currentPassword,
			newPassword: values.newPassword,
			revokeOtherSessions: false,
		});

		if (error) {
			toast.error(
				error.code === 'INVALID_PASSWORD'
					? 'Current password is incorrect.'
					: 'Failed to change password. Please try again.',
			);
			return;
		}

		toast.success('Password updated.');
		onClose(false);
	};

	return (
		<Dialog open={open} onOpenChange={onClose}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>Account</DialogTitle>
				</DialogHeader>

				{/* Account info */}
				<div className="border-border/50 bg-muted/30 flex items-center gap-3 rounded-xl border px-4 py-3">
					<Avatar className="size-10 rounded-xl">
						<AvatarImage src={user.avatar} alt={user.name} />
						<AvatarFallback className="rounded-xl text-sm font-medium">
							{getInitials(user.name)}
						</AvatarFallback>
					</Avatar>
					<div className="min-w-0">
						<p className="truncate text-sm font-medium">{user.name}</p>
						<p className="text-muted-foreground truncate text-xs">
							{user.email}
						</p>
					</div>
				</div>

				{/* Change password */}
				<form onSubmit={handleSubmit(onSubmit)}>
					<p className="mb-3 text-sm font-medium">Change password</p>
					<FieldGroup>
						<Field>
							<Label>Current password</Label>
							<div className="relative">
								<Input
									type={showCurrent ? 'text' : 'password'}
									aria-invalid={!!errors.currentPassword}
									{...register('currentPassword')}
								/>
								<button
									type="button"
									onClick={() => setShowCurrent((p) => !p)}
									className="text-muted-foreground/50 hover:text-muted-foreground absolute right-3 top-1/2 -translate-y-1/2"
								>
									{showCurrent ? (
										<EyeOff className="size-4" />
									) : (
										<Eye className="size-4" />
									)}
								</button>
							</div>
							<FieldError errors={[errors.currentPassword]} />
						</Field>

						<Field>
							<Label>New password</Label>
							<div className="relative">
								<Input
									type={showNew ? 'text' : 'password'}
									aria-invalid={!!errors.newPassword}
									{...register('newPassword')}
								/>
								<button
									type="button"
									onClick={() => setShowNew((p) => !p)}
									className="text-muted-foreground/50 hover:text-muted-foreground absolute right-3 top-1/2 -translate-y-1/2"
								>
									{showNew ? (
										<EyeOff className="size-4" />
									) : (
										<Eye className="size-4" />
									)}
								</button>
							</div>
							<FieldError errors={[errors.newPassword]} />
						</Field>

						<Field>
							<Label>Confirm new password</Label>
							<div className="relative">
								<Input
									type={showConfirm ? 'text' : 'password'}
									aria-invalid={!!errors.confirmPassword}
									{...register('confirmPassword')}
								/>
								<button
									type="button"
									onClick={() => setShowConfirm((p) => !p)}
									className="text-muted-foreground/50 hover:text-muted-foreground absolute right-3 top-1/2 -translate-y-1/2"
								>
									{showConfirm ? (
										<EyeOff className="size-4" />
									) : (
										<Eye className="size-4" />
									)}
								</button>
							</div>
							<FieldError errors={[errors.confirmPassword]} />
						</Field>
					</FieldGroup>

					<Button type="submit" className="mt-4 w-full" disabled={isSubmitting}>
						{isSubmitting ? (
							<Loader2 className="size-4 animate-spin" />
						) : (
							'Update password'
						)}
					</Button>
				</form>
			</DialogContent>
		</Dialog>
	);
}

// ---------------------------------------------------------------------------
// NavUser
// ---------------------------------------------------------------------------

export function NavUser({
	user,
}: {
	user: { name: string; email: string; avatar?: string };
}) {
	const { isMobile } = useSidebar();
	const navigate = useNavigate();
	const [accountOpen, setAccountOpen] = useState(false);
	const initials = getInitials(user.name);

	const logOut = () => {
		authClient.signOut({
			fetchOptions: {
				onSuccess: () => {
					invalidateSessionCache();
					void navigate('/login');
				},
			},
		});
	};

	return (
		<>
			<SidebarMenu>
				<SidebarMenuItem>
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<SidebarMenuButton
								size="lg"
								className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
							>
								<Avatar className="h-8 w-8 rounded-lg">
									<AvatarImage src={user.avatar} alt={user.name} />
									<AvatarFallback className="rounded-lg">
										{initials}
									</AvatarFallback>
								</Avatar>
								<div className="grid flex-1 text-left text-sm leading-tight">
									<span className="truncate font-medium">{user.name}</span>
									<span className="truncate text-xs">{user.email}</span>
								</div>
								<ChevronsUpDown className="ml-auto size-4" />
							</SidebarMenuButton>
						</DropdownMenuTrigger>

						<DropdownMenuContent
							className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
							side={isMobile ? 'bottom' : 'right'}
							align="end"
							sideOffset={4}
						>
							<DropdownMenuLabel className="p-0 font-normal">
								<div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
									<Avatar className="h-8 w-8 rounded-lg">
										<AvatarImage src={user.avatar} alt={user.name} />
										<AvatarFallback className="rounded-lg">
											{initials}
										</AvatarFallback>
									</Avatar>
									<div className="grid flex-1 text-left text-sm leading-tight">
										<span className="truncate font-medium">{user.name}</span>
										<span className="truncate text-xs">{user.email}</span>
									</div>
								</div>
							</DropdownMenuLabel>

							<DropdownMenuSeparator />

							<DropdownMenuItem onClick={() => setAccountOpen(true)}>
								<BadgeCheck />
								Account
							</DropdownMenuItem>

							<DropdownMenuSeparator />

							<DropdownMenuItem onClick={logOut}>
								<LogOut />
								Log out
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</SidebarMenuItem>
			</SidebarMenu>

			<AccountModal
				open={accountOpen}
				onOpenChange={setAccountOpen}
				user={user}
			/>
		</>
	);
}
