import { useState } from 'react';
import { Check, ExternalLink, Pencil, Plus, Trash2, X } from 'lucide-react';
import type { ResumeStructuredData } from '@uppler/types';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type Project = NonNullable<ResumeStructuredData['projects']>[number];

function TechPill({ label }: { label: string }) {
	return (
		<span className="border-border/50 bg-muted/50 text-muted-foreground rounded-md border px-1.5 py-0.5 text-[11px]">
			{label}
		</span>
	);
}

function ProjectEntry({
	entry,
	onUpdate,
	onRemove,
}: {
	entry: Project;
	onUpdate: (updated: Project) => void;
	onRemove: () => void;
}) {
	const [editing, setEditing] = useState(false);
	const [draft, setDraft] = useState(entry);
	const [techInput, setTechInput] = useState(
		entry.technologies?.join(', ') ?? '',
	);

	const commit = () => {
		onUpdate({
			...draft,
			technologies: techInput
				.split(',')
				.map((t) => t.trim())
				.filter(Boolean),
		});
		setEditing(false);
	};
	const discard = () => {
		setDraft(entry);
		setTechInput(entry.technologies?.join(', ') ?? '');
		setEditing(false);
	};

	if (!editing) {
		return (
			<div className="group/proj flex items-start justify-between gap-3">
				<div className="min-w-0 flex-1">
					<div className="flex items-center gap-2">
						<p className="text-foreground text-sm font-medium leading-snug">
							{entry.name}
						</p>
						{entry.url && (
							<a
								href={entry.url}
								target="_blank"
								rel="noopener noreferrer"
								className="text-muted-foreground/40 hover:text-accent transition-colors"
								aria-label="View project"
							>
								<ExternalLink className="size-3" />
							</a>
						)}
					</div>
					{entry.description && (
						<p className="text-muted-foreground mt-1 line-clamp-2 text-xs leading-relaxed">
							{entry.description}
						</p>
					)}
					{entry.technologies && entry.technologies.length > 0 && (
						<div className="mt-2 flex flex-wrap gap-1">
							{entry.technologies.map((tech) => (
								<TechPill key={tech} label={tech} />
							))}
						</div>
					)}
				</div>
				<div className="flex shrink-0 items-center gap-1 pt-0.5 opacity-0 transition-opacity group-hover/proj:opacity-100">
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
		<div className="border-border/50 bg-muted/40 flex flex-col gap-3 rounded-xl border p-4">
			<div className="flex flex-col gap-1">
				<label className="text-muted-foreground text-xs">Project name</label>
				<Input
					value={draft.name}
					onChange={(e) => setDraft({ ...draft, name: e.target.value })}
					className="h-8 text-sm"
					placeholder="e.g. Open Source CLI Tool"
				/>
			</div>
			<div className="flex flex-col gap-1">
				<label className="text-muted-foreground text-xs">Description</label>
				<textarea
					value={draft.description ?? ''}
					onChange={(e) =>
						setDraft({ ...draft, description: e.target.value || undefined })
					}
					className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring min-h-[72px] w-full resize-none rounded-md border px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
					placeholder="What it does and your role…"
				/>
			</div>
			<div className="grid grid-cols-2 gap-3">
				<div className="flex flex-col gap-1">
					<label className="text-muted-foreground text-xs">URL</label>
					<Input
						value={draft.url ?? ''}
						onChange={(e) =>
							setDraft({ ...draft, url: e.target.value || undefined })
						}
						className="h-8 text-sm"
						placeholder="https://…"
					/>
				</div>
				<div className="flex flex-col gap-1">
					<label className="text-muted-foreground text-xs">
						Technologies (comma-separated)
					</label>
					<Input
						value={techInput}
						onChange={(e) => setTechInput(e.target.value)}
						className="h-8 text-sm"
						placeholder="React, Node.js, Postgres"
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

interface ReviewProjectsSectionProps {
	projects: NonNullable<ResumeStructuredData['projects']>;
	onChange: (updated: NonNullable<ResumeStructuredData['projects']>) => void;
}

export function ReviewProjectsSection({
	projects,
	onChange,
}: ReviewProjectsSectionProps) {
	const update = (index: number, updated: Project) => {
		const next = [...projects];
		next[index] = updated;
		onChange(next);
	};
	const remove = (index: number) =>
		onChange(projects.filter((_, i) => i !== index));
	const add = () =>
		onChange([
			...projects,
			{ name: '', description: '', url: '', technologies: [] },
		]);

	if (projects.length === 0) {
		return (
			<button
				type="button"
				onClick={add}
				className="border-border text-muted-foreground hover:text-foreground flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed py-4 text-sm transition-colors"
			>
				<Plus className="size-4" />
				Add project
			</button>
		);
	}

	return (
		<div className="flex flex-col gap-4">
			{projects.map((entry, i) => (
				<ProjectEntry
					key={i}
					entry={entry}
					onUpdate={(updated) => update(i, updated)}
					onRemove={() => remove(i)}
				/>
			))}
			<button
				type="button"
				onClick={add}
				className="text-muted-foreground/50 hover:text-muted-foreground flex items-center gap-1 self-start text-sm transition-colors"
			>
				<Plus className="size-3.5" />
				Add project
			</button>
		</div>
	);
}
