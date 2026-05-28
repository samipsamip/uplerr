import { useState } from 'react';
import { Check, GraduationCap, Pencil, Plus, Trash2, X } from 'lucide-react';
import type { ResumeStructuredData } from '@uppler/types';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type Education = ResumeStructuredData['education'][number];

function EducationEntry({
	entry,
	onUpdate,
	onRemove,
}: {
	entry: Education;
	onUpdate: (updated: Education) => void;
	onRemove: () => void;
}) {
	const [editing, setEditing] = useState(false);
	const [draft, setDraft] = useState(entry);

	const commit = () => {
		onUpdate(draft);
		setEditing(false);
	};
	const discard = () => {
		setDraft(entry);
		setEditing(false);
	};

	if (!editing) {
		return (
			<div className="group flex items-start gap-3">
				<div className="bg-accent/[0.08] mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg">
					<GraduationCap className="text-accent size-4" />
				</div>
				<div className="flex-1">
					<div className="flex items-start justify-between gap-2">
						<div>
							<p className="font-medium leading-tight">{entry.degree}</p>
							<p className="text-muted-foreground mt-0.5 text-sm">
								{entry.institution}
							</p>
							{entry.year && (
								<p className="text-muted-foreground mt-0.5 text-xs">
									{entry.year}
								</p>
							)}
						</div>
						<div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
							<button
								type="button"
								onClick={() => setEditing(true)}
								className="text-muted-foreground hover:text-foreground"
								aria-label="Edit"
							>
								<Pencil className="size-3.5" />
							</button>
							<button
								type="button"
								onClick={onRemove}
								className="text-muted-foreground hover:text-destructive"
								aria-label="Remove"
							>
								<Trash2 className="size-3.5" />
							</button>
						</div>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="border-border bg-muted/30 flex flex-col gap-3 rounded-xl border p-4">
			<div className="grid grid-cols-2 gap-3">
				<div className="col-span-2 flex flex-col gap-1">
					<label className="text-muted-foreground text-xs">
						Degree / Qualification
					</label>
					<Input
						value={draft.degree}
						onChange={(e) => setDraft({ ...draft, degree: e.target.value })}
						className="h-8 text-sm"
					/>
				</div>
				<div className="flex flex-col gap-1">
					<label className="text-muted-foreground text-xs">Institution</label>
					<Input
						value={draft.institution}
						onChange={(e) =>
							setDraft({ ...draft, institution: e.target.value })
						}
						className="h-8 text-sm"
					/>
				</div>
				<div className="flex flex-col gap-1">
					<label className="text-muted-foreground text-xs">Year</label>
					<Input
						value={draft.year ?? ''}
						onChange={(e) =>
							setDraft({ ...draft, year: e.target.value || undefined })
						}
						className="h-8 text-sm"
						placeholder="e.g. 2020"
					/>
				</div>
			</div>
			<div className="flex items-center justify-end gap-2">
				<Button variant="ghost" size="sm" onClick={discard}>
					<X className="mr-1 size-3" />
					Discard
				</Button>
				<Button size="sm" onClick={commit}>
					<Check className="mr-1 size-3" />
					Save
				</Button>
			</div>
		</div>
	);
}

interface ReviewEducationSectionProps {
	education: Education[];
	onChange: (updated: Education[]) => void;
}

export function ReviewEducationSection({
	education,
	onChange,
}: ReviewEducationSectionProps) {
	const update = (index: number, updated: Education) => {
		const next = [...education];
		next[index] = updated;
		onChange(next);
	};
	const remove = (index: number) =>
		onChange(education.filter((_, i) => i !== index));
	const add = () =>
		onChange([...education, { institution: '', degree: '', year: '' }]);

	if (education.length === 0) {
		return (
			<button
				type="button"
				onClick={add}
				className="border-border text-muted-foreground hover:text-foreground flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed py-4 text-sm transition-colors"
			>
				<Plus className="size-4" />
				Add education
			</button>
		);
	}

	return (
		<div className="flex flex-col gap-4">
			{education.map((entry, i) => (
				<EducationEntry
					key={i}
					entry={entry}
					onUpdate={(updated) => update(i, updated)}
					onRemove={() => remove(i)}
				/>
			))}
			<button
				type="button"
				onClick={add}
				className="text-muted-foreground hover:text-foreground flex items-center gap-1 self-start text-sm transition-colors"
			>
				<Plus className="size-3.5" />
				Add qualification
			</button>
		</div>
	);
}
