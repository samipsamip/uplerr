import { useForm } from 'react-hook-form';
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
import { cn } from '@/lib/utils';
import { useAddSkill } from '@/query/user-skills.query';

import {
	CATEGORIES,
	LEVELS,
	skillFormSchema,
	type SkillFormValues,
} from './skill-form-schema';

const selectClassName = cn(
	'h-9 w-full rounded-md border border-input bg-input/30 px-3 py-1 text-sm',
	'text-foreground outline-none transition-colors appearance-none',
	'focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50',
	'disabled:pointer-events-none disabled:opacity-50',
);

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
			onError: (err) => toast.error(err.message),
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
							<select
								id="skill-category"
								className={selectClassName}
								aria-invalid={!!errors.category}
								{...register('category')}
							>
								<option value="">Select a category</option>
								{CATEGORIES.map((cat) => (
									<option key={cat} value={cat}>
										{cat}
									</option>
								))}
							</select>
							<FieldError errors={[errors.category]} />
						</Field>

						<Field>
							<Label htmlFor="skill-level">Experience level</Label>
							<select
								id="skill-level"
								className={selectClassName}
								aria-invalid={!!errors.level}
								{...register('level')}
							>
								<option value="">Select a level</option>
								{LEVELS.map(({ value, label }) => (
									<option key={value} value={value}>
										{label}
									</option>
								))}
							</select>
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
