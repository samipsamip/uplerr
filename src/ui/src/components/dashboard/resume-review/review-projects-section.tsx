import { useState } from 'react';
import { Check, ExternalLink, Pencil, Plus, Trash2 } from 'lucide-react';
import type { ProjectExtractionType } from '@uppler/types';

import { BrandIcon } from '@/components/dashboard/brand-icon';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { getSkillIcon } from '@/lib/skill-icon';
import { cn } from '@/lib/utils';

type Project = ProjectExtractionType['projects'][number];

const TYPE_LABELS: Record<Project['type'], string> = {
	company: 'Company',
	solo: 'Personal',
	freelance: 'Freelance',
};

const TYPE_CLASSES: Record<Project['type'], string> = {
	company: 'bg-accent/10 text-accent border-0',
	solo: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-0',
	freelance: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-0',
};

const EMPTY_PROJECT: Project = {
	name: '',
	description: '',
	technologies: [],
	links: [],
	type: 'solo',
	source: 'projects_section',
};

function hasGoodShape(p: Project): boolean {
	return !!(p.name && p.description);
}

interface ProjectCardProps {
	project: Project;
	onSave: (updated: Project) => void;
	onRemove: () => void;
	defaultEditing?: boolean;
}

function ProjectCard({
	project,
	onSave,
	onRemove,
	defaultEditing = false,
}: ProjectCardProps) {
	const [editing, setEditing] = useState(defaultEditing);
	const [draft, setDraft] = useState<Project>(project);
	const [error, setError] = useState<string | null>(null);

	const save = () => {
		if (!draft.name.trim()) {
			setError('Project name is required.');
			return;
		}
		if (!draft.description.trim()) {
			setError('Description is required.');
			return;
		}
		setError(null);
		onSave(draft);
		setEditing(false);
	};

	const discard = () => {
		setDraft(project);
		setError(null);
		setEditing(false);
	};

	if (editing) {
		return (
			<div className="border-border/40 flex flex-col gap-3 rounded-xl border p-4">
				<Input
					value={draft.name}
					onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
					placeholder="Project name"
					className="font-medium"
				/>
				<Textarea
					value={draft.description}
					onChange={(e) =>
						setDraft((d) => ({ ...d, description: e.target.value }))
					}
					placeholder="Short description"
					rows={2}
					className="resize-none text-sm"
				/>
				<div className="flex flex-col gap-1">
					<p className="text-muted-foreground/50 text-[11px] font-semibold uppercase tracking-wide">
						Technologies (comma-separated)
					</p>
					<Input
						value={draft.technologies.join(', ')}
						onChange={(e) =>
							setDraft((d) => ({
								...d,
								technologies: e.target.value
									.split(',')
									.map((t) => t.trim())
									.filter(Boolean),
							}))
						}
						placeholder="React, TypeScript, Docker…"
						className="text-sm"
					/>
				</div>
				<div className="flex flex-col gap-1">
					<p className="text-muted-foreground/50 text-[11px] font-semibold uppercase tracking-wide">
						Links (one per line)
					</p>
					<Textarea
						value={draft.links.join('\n')}
						onChange={(e) =>
							setDraft((d) => ({
								...d,
								links: e.target.value
									.split('\n')
									.map((l) => l.trim())
									.filter(Boolean),
							}))
						}
						placeholder="https://github.com/…"
						rows={2}
						className="resize-none text-sm"
					/>
				</div>
				<div className="flex flex-col gap-1">
					<p className="text-muted-foreground/50 text-[11px] font-semibold uppercase tracking-wide">
						Type
					</p>
					<div className="flex gap-2">
						{(['company', 'solo', 'freelance'] as const).map((t) => (
							<Button
								key={t}
								type="button"
								variant="outline"
								size="sm"
								onClick={() => setDraft((d) => ({ ...d, type: t }))}
								className={cn(
									'rounded-lg border text-xs font-medium transition-colors',
									draft.type === t
										? TYPE_CLASSES[t]
										: 'border-border/40 text-muted-foreground hover:border-border',
								)}
							>
								{TYPE_LABELS[t]}
							</Button>
						))}
					</div>
				</div>
				{error && <p className="text-destructive text-xs">{error}</p>}
				<div className="flex justify-end gap-2 pt-1">
					<Button
						size="sm"
						variant="ghost"
						onClick={discard}
						aria-label="Discard"
					>
						Discard
					</Button>
					<Button size="sm" onClick={save} aria-label="Save">
						<Check className="mr-1 size-3.5" />
						Save
					</Button>
				</div>
			</div>
		);
	}

	const isGood = hasGoodShape(project);

	return (
		<div className="border-border/40 rounded-xl border p-4">
			<div className="flex items-start justify-between gap-2">
				<div className="flex min-w-0 flex-col gap-1">
					<div className="flex flex-wrap items-center gap-2">
						<p className="text-sm font-medium leading-tight">
							{project.name || (
								<span className="text-muted-foreground/40 italic">
									Untitled project
								</span>
							)}
						</p>
						<Badge className={cn('text-[10px]', TYPE_CLASSES[project.type])}>
							{TYPE_LABELS[project.type]}
						</Badge>
						<Badge
							className={cn(
								'border-0 text-[10px]',
								isGood
									? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
									: 'bg-amber-500/10 text-amber-700 dark:text-amber-400',
							)}
						>
							{isGood ? 'Looks good' : 'Review suggested'}
						</Badge>
					</div>
					{project.description && (
						<p className="text-muted-foreground mt-0.5 text-xs leading-relaxed">
							{project.description}
						</p>
					)}
					{project.technologies.length > 0 && (
						<div className="mt-1.5 flex flex-wrap gap-1">
							{project.technologies.map((tech) => {
								const icon = getSkillIcon(tech);
								return (
									<span
										key={tech}
										className="bg-muted/60 text-foreground/70 flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px]"
									>
										{icon && (
											<BrandIcon
												name={icon}
												size={11}
												className="shrink-0 opacity-80"
											/>
										)}
										{tech}
									</span>
								);
							})}
						</div>
					)}
					{project.links.length > 0 && (
						<div className="mt-1 flex flex-col gap-0.5">
							{project.links.map((link) => (
								<span
									key={link}
									className="text-accent flex items-center gap-1 text-xs"
								>
									<ExternalLink className="size-3 shrink-0" />
									<span className="truncate">{link}</span>
								</span>
							))}
						</div>
					)}
				</div>
				<div className="flex shrink-0 gap-1">
					<Button
						type="button"
						variant="ghost"
						size="icon"
						onClick={() => setEditing(true)}
						className="text-muted-foreground/40 hover:text-foreground size-6"
						aria-label="Edit project"
					>
						<Pencil className="size-3.5" />
					</Button>
					<Button
						type="button"
						variant="ghost"
						size="icon"
						onClick={onRemove}
						className="text-muted-foreground/40 hover:text-destructive size-6"
						aria-label="Remove project"
					>
						<Trash2 className="size-3.5" />
					</Button>
				</div>
			</div>
		</div>
	);
}

interface ReviewProjectsSectionProps {
	projects: ProjectExtractionType;
	onChange: (projects: ProjectExtractionType) => void;
}

export function ReviewProjectsSection({
	projects,
	onChange,
}: ReviewProjectsSectionProps) {
	const update = (index: number, updated: Project) => {
		const next = projects.projects.map((p, i) => (i === index ? updated : p));
		onChange({ projects: next });
	};

	const remove = (index: number) => {
		onChange({ projects: projects.projects.filter((_, i) => i !== index) });
	};

	const addNew = () => {
		onChange({ projects: [...projects.projects, { ...EMPTY_PROJECT }] });
	};

	if (projects.projects.length === 0) {
		return (
			<div className="flex flex-col items-center gap-3 py-8">
				<p className="text-muted-foreground/50 text-sm">
					No projects extracted
				</p>
				<Button
					size="sm"
					variant="outline"
					onClick={addNew}
					aria-label="Add project"
				>
					<Plus className="mr-1.5 size-3.5" />
					Add project
				</Button>
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-3">
			{projects.projects.map((project, i) => (
				<ProjectCard
					key={project.name || 'project'}
					project={project}
					onSave={(updated) => update(i, updated)}
					onRemove={() => remove(i)}
				/>
			))}
			<Button
				type="button"
				variant="outline"
				size="sm"
				onClick={addNew}
				className="text-muted-foreground/40 hover:text-muted-foreground gap-1.5 self-start rounded-lg border-dashed text-xs"
			>
				<Plus className="size-3" />
				Add project
			</Button>
		</div>
	);
}
