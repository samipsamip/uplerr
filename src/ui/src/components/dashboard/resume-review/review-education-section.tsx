import { useState } from 'react';
import {
	BookOpen,
	Check,
	GraduationCap,
	Pencil,
	Plus,
	Trash2,
	X,
} from 'lucide-react';
import type { ResumeExtractionType } from '@uppler/types';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type Education = ResumeExtractionType['education'][number];

function EducationEntry({
	entry,
	onUpdate,
	onRemove,
	autoEdit,
}: {
	entry: Education;
	onUpdate: (updated: Education) => void;
	onRemove: () => void;
	autoEdit?: boolean;
}) {
	const [editing, setEditing] = useState(autoEdit ?? false);
	const [draft, setDraft] = useState(entry);
	const [error, setError] = useState<string | null>(null);

	const commit = () => {
		if (!draft.degree?.trim()) {
			setError('Degree / qualification is required.');
			return;
		}
		if (!draft.institution?.trim()) {
			setError('Institution is required.');
			return;
		}
		setError(null);
		onUpdate(draft);
		setEditing(false);
	};
	const discard = () => {
		setDraft(entry);
		setError(null);
		setEditing(false);
	};

	if (!editing) {
		const isDiploma = /diploma|certificate/i.test(entry.degree ?? '');
		const IconComponent = isDiploma ? BookOpen : GraduationCap;
		const endYear = entry.end_date.raw ?? null;

		return (
			<div className="group/edu flex items-start gap-3">
				<div className="bg-accent/[0.08] text-accent shrink-0 rounded-xl p-2.5">
					<IconComponent className="size-4" />
				</div>
				<div className="min-w-0 flex-1">
					<p className="text-foreground text-sm font-medium leading-snug">
						{entry.degree}
					</p>
					<p className="text-muted-foreground mt-0.5 text-xs">
						{entry.institution}
						{entry.field_of_study && (
							<span className="text-muted-foreground/60">
								{' '}
								· {entry.field_of_study}
							</span>
						)}
						{endYear && (
							<span className="text-muted-foreground/60"> · {endYear}</span>
						)}
					</p>
				</div>
				<div className="flex shrink-0 items-center gap-1 pt-0.5 opacity-0 transition-opacity group-hover/edu:opacity-100">
					<button
						type="button"
						onClick={() => setEditing(true)}
						className="text-muted-foreground/40 hover:text-muted-foreground transition-colors"
						aria-label="Edit"
					>
						<Pencil className="size-3.5" />
					</button>
					<button
						type="button"
						onClick={onRemove}
						className="text-muted-foreground/40 hover:text-destructive transition-colors"
						aria-label="Remove"
					>
						<Trash2 className="size-3.5" />
					</button>
				</div>
			</div>
		);
	}

	return (
		<div className="border-border/50 bg-card flex flex-col gap-3 rounded-xl border p-4 shadow-[0_2px_8px_rgba(0,0,0,0.03)]">
			<div className="grid grid-cols-2 gap-3">
				<div className="col-span-2 flex flex-col gap-1">
					<label className="text-muted-foreground text-xs">
						Degree / Qualification
					</label>
					<Input
						value={draft.degree ?? ''}
						onChange={(e) =>
							setDraft({ ...draft, degree: e.target.value || null })
						}
						className="h-8 text-sm"
					/>
				</div>
				<div className="flex flex-col gap-1">
					<label className="text-muted-foreground text-xs">Institution</label>
					<Input
						value={draft.institution ?? ''}
						onChange={(e) =>
							setDraft({ ...draft, institution: e.target.value || null })
						}
						className="h-8 text-sm"
					/>
				</div>
				<div className="flex flex-col gap-1">
					<label className="text-muted-foreground text-xs">
						Field of study
					</label>
					<Input
						value={draft.field_of_study ?? ''}
						onChange={(e) =>
							setDraft({ ...draft, field_of_study: e.target.value || null })
						}
						className="h-8 text-sm"
					/>
				</div>
				<div className="flex flex-col gap-1">
					<label className="text-muted-foreground text-xs">Start</label>
					<Input
						value={draft.start_date.raw ?? ''}
						onChange={(e) =>
							setDraft({
								...draft,
								start_date: {
									...draft.start_date,
									raw: e.target.value || null,
								},
							})
						}
						className="h-8 text-sm"
						placeholder="e.g. Sep 2016"
					/>
				</div>
				<div className="flex flex-col gap-1">
					<label className="text-muted-foreground text-xs">End</label>
					<Input
						value={draft.end_date.raw ?? ''}
						onChange={(e) =>
							setDraft({
								...draft,
								end_date: { ...draft.end_date, raw: e.target.value || null },
							})
						}
						className="h-8 text-sm"
						placeholder="e.g. Jun 2020"
					/>
				</div>
			</div>
			{error && <p className="text-destructive text-xs">{error}</p>}
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
	const [newIndex, setNewIndex] = useState<number | null>(null);

	const update = (index: number, updated: Education) => {
		const next = [...education];
		next[index] = updated;
		onChange(next);
		if (index === newIndex) setNewIndex(null);
	};
	const remove = (index: number) => {
		onChange(education.filter((_, i) => i !== index));
		if (index === newIndex) setNewIndex(null);
	};
	const add = () => {
		const blank: Education = {
			institution: null,
			degree: null,
			field_of_study: null,
			start_date: { raw: null, normalized: null },
			end_date: { raw: null, normalized: null },
		};
		const next = [...education, blank];
		onChange(next);
		setNewIndex(next.length - 1);
	};

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
					autoEdit={i === newIndex}
				/>
			))}
			<button
				type="button"
				onClick={add}
				className="text-muted-foreground/50 hover:text-muted-foreground flex items-center gap-1 self-start text-sm transition-colors"
			>
				<Plus className="size-3.5" />
				Add qualification
			</button>
		</div>
	);
}
