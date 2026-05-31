import { useState } from 'react';
import { Controller,useForm } from 'react-hook-form';
import { Trash } from 'lucide-react';
import { toast } from 'sonner';
import { zodResolver } from '@hookform/resolvers/zod';

import { Button } from '@/components/ui/button';
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import { Field, FieldError, FieldGroup } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import type { UserSkill } from '@/network/user-skills.service';
import { useDeleteSkill, useUpdateSkill } from '@/query/user-skills.query';

import {
	CATEGORIES,
	LEVELS,
	skillFormSchema,
	type SkillFormValues,
} from './skill-form-schema';

type EditSkillDialogProps = {
	skill: UserSkill;
	open: boolean;
	onOpenChange: (open: boolean) => void;
};

export function EditSkillDialog({
	skill,
	open,
	onOpenChange,
}: EditSkillDialogProps) {
	const [confirming, setConfirming] = useState(false);

	const { mutate: updateSkill, isPending: isUpdating } = useUpdateSkill();
	const { mutate: deleteSkill, isPending: isDeleting } = useDeleteSkill();

	const {
		register,
		handleSubmit,
		reset,
		control,
		formState: { errors },
	} = useForm<SkillFormValues>({
		resolver: zodResolver(skillFormSchema),
		values: {
			name: skill.name,
			category: skill.category,
			level: skill.level,
		},
	});

	const handleClose = (next: boolean) => {
		if (!next) {
			reset();
			setConfirming(false);
		}
		onOpenChange(next);
	};

	const onSubmit = (values: SkillFormValues) => {
		updateSkill(
			{ skillId: skill.id, payload: values },
			{
				onSuccess: () => {
					toast.success('Skill updated.');
					handleClose(false);
				},
				onError: (err) => toast.error(err.message),
			},
		);
	};

	const onDelete = () => {
		deleteSkill(skill.id, {
			onSuccess: () => {
				toast.success('Skill removed.');
				handleClose(false);
			},
			onError: (err) => toast.error(err.message),
		});
	};

	return (
		<Dialog open={open} onOpenChange={handleClose}>
			<DialogContent className="sm:max-w-md">
				<form
					onSubmit={handleSubmit(onSubmit, () =>
						toast.error('Please fill in all required fields.'),
					)}
				>
					<DialogHeader>
						<DialogTitle>Edit Skill</DialogTitle>
						<DialogDescription>
							Update your skill details below.
						</DialogDescription>
						<div className="pt-1">
							{confirming ? (
								<div className="flex items-center gap-2">
									<span className="text-muted-foreground text-xs">
										Remove this skill?
									</span>
									<Button
										type="button"
										variant="destructive"
										size="sm"
										disabled={isDeleting}
										onClick={onDelete}
									>
										{isDeleting ? 'Removing...' : 'Confirm'}
									</Button>
									<Button
										type="button"
										variant="ghost"
										size="sm"
										onClick={() => setConfirming(false)}
									>
										Cancel
									</Button>
								</div>
							) : (
								<Button
									type="button"
									variant="outline"
									onClick={() => setConfirming(true)}
									className="text-muted-foreground hover:text-destructive text-xs transition-colors"
								>
									<Trash />
									Remove skill
								</Button>
							)}
						</div>
					</DialogHeader>

					<FieldGroup className="py-5">
						<Field>
							<Label htmlFor="edit-skill-name">Skill name</Label>
							<Input
								id="edit-skill-name"
								aria-invalid={!!errors.name}
								{...register('name')}
							/>
							<FieldError errors={[errors.name]} />
						</Field>

						<Field>
							<Label htmlFor="edit-skill-category">Category</Label>
							<Controller
								name="category"
								control={control}
								render={({ field }) => (
									<Select onValueChange={field.onChange} value={field.value}>
										<SelectTrigger
											id="edit-skill-category"
											aria-invalid={!!errors.category}
										>
											<SelectValue placeholder="Select a category" />
										</SelectTrigger>
										<SelectContent>
											{CATEGORIES.map((cat) => (
												<SelectItem key={cat} value={cat}>
													{cat}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								)}
							/>
							<FieldError errors={[errors.category]} />
						</Field>

						<Field>
							<Label htmlFor="edit-skill-level">Experience level</Label>
							<Controller
								name="level"
								control={control}
								render={({ field }) => (
									<Select onValueChange={field.onChange} value={field.value}>
										<SelectTrigger
											id="edit-skill-level"
											aria-invalid={!!errors.level}
										>
											<SelectValue placeholder="Select a level" />
										</SelectTrigger>
										<SelectContent>
											{LEVELS.map(({ value, label }) => (
												<SelectItem key={value} value={value}>
													{label}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								)}
							/>
							<FieldError errors={[errors.level]} />
						</Field>
					</FieldGroup>

					<DialogFooter>
						<DialogClose asChild>
							<Button type="button" variant="outline">
								Cancel
							</Button>
						</DialogClose>
						<Button type="submit" disabled={isUpdating || confirming}>
							{isUpdating ? 'Saving...' : 'Save changes'}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
