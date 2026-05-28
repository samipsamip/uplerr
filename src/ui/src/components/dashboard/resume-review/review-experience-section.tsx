import { useState } from 'react';
import { Check, Pencil, Plus, Trash2, X } from 'lucide-react';
import type { ResumeStructuredData } from '@uppler/types';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type Experience = ResumeStructuredData['experience'][number];

function ExperienceEntry({
	entry,
	onUpdate,
	onRemove,
}: {
	entry: Experience;
	onUpdate: (updated: Experience) => void;
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
			<div className="group flex items-start justify-between gap-3">
				<div className="flex-1">
					<p className="text-sm font-medium leading-snug">
						{entry.role}
						{entry.company && (
							<span className="text-muted-foreground font-normal">
								{' '}
								at {entry.company}
							</span>
						)}
					</p>
					{entry.duration && (
						<p className="text-muted-foreground mt-0.5 text-xs">
							{entry.duration}
						</p>
					)}
					{entry.description && (
						<p className="text-muted-foreground/80 mt-2 text-[13px] leading-relaxed">
							{entry.description}
						</p>
					)}
				</div>
				<div className="flex shrink-0 items-center gap-1 pt-0.5 opacity-0 transition-opacity group-hover:opacity-100">
					<button
						type="button"
						onClick={() => setEditing(true)}
						className="text-muted-foreground hover:text-foreground"
						aria-label="Edit entry"
					>
						<Pencil className="size-3.5" />
					</button>
					<button
						type="button"
						onClick={onRemove}
						className="text-muted-foreground hover:text-destructive"
						aria-label="Remove entry"
					>
						<Trash2 className="size-3.5" />
					</button>
				</div>
			</div>
		);
	}

	return (
		<div className="border-border bg-muted/30 flex flex-col gap-3 rounded-xl border p-4">
			<div className="grid grid-cols-2 gap-3">
				<div className="flex flex-col gap-1">
					<label className="text-muted-foreground text-xs">Role</label>
					<Input
						value={draft.role}
						onChange={(e) => setDraft({ ...draft, role: e.target.value })}
						className="h-8 text-sm"
					/>
				</div>
				<div className="flex flex-col gap-1">
					<label className="text-muted-foreground text-xs">Company</label>
					<Input
						value={draft.company}
						onChange={(e) => setDraft({ ...draft, company: e.target.value })}
						className="h-8 text-sm"
					/>
				</div>
				<div className="flex flex-col gap-1">
					<label className="text-muted-foreground text-xs">Duration</label>
					<Input
						value={draft.duration ?? ''}
						onChange={(e) =>
							setDraft({ ...draft, duration: e.target.value || undefined })
						}
						className="h-8 text-sm"
						placeholder="e.g. Jan 2022 – Mar 2024"
					/>
				</div>
				<div className="col-span-2 flex flex-col gap-1">
					<label className="text-muted-foreground text-xs">Description</label>
					<textarea
						value={draft.description ?? ''}
						onChange={(e) =>
							setDraft({ ...draft, description: e.target.value || undefined })
						}
						className="border-input bg-input/30 text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 min-h-[60px] w-full rounded-md border px-3 py-2 text-sm outline-none focus-visible:ring-[3px]"
						placeholder="Key responsibilities or highlights"
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

interface ReviewExperienceSectionProps {
	experience: Experience[];
	onChange: (updated: Experience[]) => void;
}

export function ReviewExperienceSection({
	experience,
	onChange,
}: ReviewExperienceSectionProps) {
	const update = (index: number, updated: Experience) => {
		const next = [...experience];
		next[index] = updated;
		onChange(next);
	};
	const remove = (index: number) =>
		onChange(experience.filter((_, i) => i !== index));
	const add = () =>
		onChange([
			...experience,
			{ company: '', role: '', duration: '', description: '' },
		]);

	if (experience.length === 0) {
		return (
			<button
				type="button"
				onClick={add}
				className="border-border text-muted-foreground hover:text-foreground flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed py-4 text-sm transition-colors"
			>
				<Plus className="size-4" />
				Add experience
			</button>
		);
	}

	return (
		<div className="divide-border/30 flex flex-col divide-y">
			{experience.map((entry, i) => (
				<div
					key={`experience-${i}`}
					className={i > 0 ? 'pt-5' : ''}
					style={i < experience.length - 1 ? { paddingBottom: '1.25rem' } : {}}
				>
					<ExperienceEntry
						entry={entry}
						onUpdate={(updated) => update(i, updated)}
						onRemove={() => remove(i)}
					/>
				</div>
			))}
			<div className="pt-4">
				<button
					type="button"
					onClick={add}
					className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-sm transition-colors"
				>
					<Plus className="size-3.5" />
					Add position
				</button>
			</div>
		</div>
	);
}
