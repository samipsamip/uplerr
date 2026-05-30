import { useState } from 'react';
import { Check, ExternalLink, Pencil, Plus, Trash2, X } from 'lucide-react';
import type { ResumeStructuredData } from '@uppler/types';

import { BrandIcon } from '@/components/dashboard/brand-icon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getSkillIcon } from '@/lib/skill-icon';

type Project = NonNullable<ResumeStructuredData['projects']>[number];

function TechBadge({ label }: { label: string }) {
	const icon = getSkillIcon(label);
	if (icon) {
		return (
			<div title={label} className="bg-muted/60 rounded-lg p-1.5">
				<BrandIcon name={icon} size={18} />
			</div>
		);
	}
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
	autoEdit,
}: {
	entry: Project;
	onUpdate: (updated: Project) => void;
	onRemove: () => void;
	autoEdit?: boolean;
}) {
	const [editing, setEditing] = useState(autoEdit ?? false);
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
			<div className="group/proj border-border/50 bg-card rounded-xl border p-3 shadow-[0_2px_8px_rgba(0,0,0,0.03)] transition-shadow hover:shadow-[0_4px_16px_rgba(0,0,0,0.05)]">
				<div className="flex items-start justify-between gap-3">
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
				{entry.technologies && entry.technologies.length > 0 && (
					<div className="mt-2 flex flex-wrap gap-1.5">
						{entry.technologies.map((tech) => (
							<TechBadge key={tech} label={tech} />
						))}
					</div>
				)}
			</div>
		);
	}

	return (
		<div className="border-border/50 bg-card flex flex-col gap-3 rounded-xl border p-4 shadow-[0_2px_8px_rgba(0,0,0,0.03)]">
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
					className="border-border/50 bg-muted/40 placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 min-h-[72px] w-full resize-none rounded-lg border px-3 py-2 text-sm outline-none focus-visible:ring-[3px]"
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
	const [newIndex, setNewIndex] = useState<number | null>(null);

	const update = (index: number, updated: Project) => {
		const next = [...projects];
		next[index] = updated;
		onChange(next);
		if (index === newIndex) setNewIndex(null);
	};
	const remove = (index: number) => {
		onChange(projects.filter((_, i) => i !== index));
		if (index === newIndex) setNewIndex(null);
	};
	const add = () => {
		const next = [
			...projects,
			{ name: '', description: '', url: '', technologies: [] },
		];
		onChange(next);
		setNewIndex(next.length - 1);
	};

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
					autoEdit={i === newIndex}
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
