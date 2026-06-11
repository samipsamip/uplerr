import { Controller, useForm } from 'react-hook-form';
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
import { useAddSkill } from '@/query/user-skills.query';

import {
	CATEGORIES,
	LEVELS,
	skillFormSchema,
	type SkillFormValues,
} from './skill-form-schema';

type AddSkillDialogButtonProps = {
	onOpenDialog: (open: boolean) => void;
	open: boolean;
};

export default function AddSkillsDialog({
	onOpenDialog,
	open,
}: AddSkillDialogButtonProps) {
	const { mutate: addSkill, isPending } = useAddSkill();

	const {
		register,
		handleSubmit,
		reset,
		control,
		formState: { errors },
	} = useForm<SkillFormValues>({
		resolver: zodResolver(skillFormSchema),
	});

	const onSubmit = (values: SkillFormValues) => {
		addSkill(values, {
			onSuccess: () => {
				toast.success('Skill added.');
				reset();
				onOpenDialog(false);
			},
			onError: () => toast.error('Failed to add skill. Please try again.'),
		});
	};

	return (
		<Dialog
			open={open}
			onOpenChange={(next) => {
				if (!next) reset();
				onOpenDialog(next);
			}}
		>
			<DialogContent className="sm:max-w-md">
				<form
					onSubmit={handleSubmit(onSubmit, () =>
						toast.error('Please fill in all required fields.'),
					)}
				>
					<DialogHeader>
						<DialogTitle>Add Skill</DialogTitle>
						<DialogDescription>
							Add a skill and your experience level to your profile.
						</DialogDescription>
					</DialogHeader>

					<FieldGroup className="py-5">
						<Field>
							<Label htmlFor="skill-name">Skill name</Label>
							<Input
								id="skill-name"
								placeholder="e.g. TypeScript"
								aria-invalid={!!errors.name}
								{...register('name')}
							/>
							<FieldError errors={[errors.name]} />
						</Field>

						<Field>
							<Label htmlFor="skill-category">Category</Label>
							<Controller
								name="category"
								control={control}
								render={({ field }) => (
									<Select onValueChange={field.onChange} value={field.value}>
										<SelectTrigger
											id="skill-category"
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
							<Label htmlFor="skill-level">Experience level</Label>
							<Controller
								name="level"
								control={control}
								render={({ field }) => (
									<Select onValueChange={field.onChange} value={field.value}>
										<SelectTrigger
											id="skill-level"
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
						<Button type="submit" disabled={isPending}>
							{isPending ? 'Adding...' : 'Add skill'}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
