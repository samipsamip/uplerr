import { useState } from 'react';
import { Check, Pencil, Plus, Sparkles, Trash2, X } from 'lucide-react';
import type { ResumeStructuredData } from '@uppler/types';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

import { DurationRangePicker } from './duration-range-picker';

type Experience = ResumeStructuredData['experience'][number];

const TECH_KEYWORDS = [
	'React',
	'TypeScript',
	'JavaScript',
	'Node.js',
	'Python',
	'Go',
	'Java',
	'Rust',
	'Docker',
	'Kubernetes',
	'Terraform',
	'AWS',
	'GCP',
	'Google Cloud Platform',
	'Azure',
	'Firebase',
	'PostgreSQL',
	'Postgres',
	'MySQL',
	'MongoDB',
	'Redis',
	'SQL',
	'NoSQL',
	'Next.js',
	'Vue',
	'Angular',
	'Express',
	'Django',
	'FastAPI',
	'HubSpot',
	'Stripe',
	'Bookshelf',
	'Sequelize',
	'CloudWatch',
	'Pub/Sub',
	'Cloudbuild',
	'CodeCommit',
	'RDS',
	'S3',
	'GraphQL',
	'Ant Design Library',
	'Tailwind',
	'Ngrok',
];

function extractTech(description: string | undefined): string[] {
	if (!description) return [];
	return TECH_KEYWORDS.filter((t) =>
		description.toLowerCase().includes(t.toLowerCase()),
	).slice(0, 6);
}

type ConfidenceState = 'good' | 'review' | 'extracted';

function getConfidence(entry: Experience): ConfidenceState {
	const hasCore = entry.role && entry.company && entry.duration;
	const hasDetail = (entry.description?.length ?? 0) > 100;
	if (hasCore && hasDetail) return 'good';
	if (hasCore) return 'extracted';
	return 'review';
}

function ConfidenceBadge({ state }: { state: ConfidenceState }) {
	if (state === 'good') {
		return (
			<span className="flex items-center gap-1 text-xs text-emerald-600/70 dark:text-emerald-500/70">
				<span className="size-1.5 shrink-0 rounded-full bg-emerald-500/70" />
				Looks good
			</span>
		);
	}
	if (state === 'review') {
		return (
			<span className="flex items-center gap-1 text-xs text-amber-600/70 dark:text-amber-500/70">
				<span className="size-1.5 shrink-0 rounded-full bg-amber-400/80" />
				Review suggested
			</span>
		);
	}
	return (
		<span className="text-muted-foreground/50 flex items-center gap-1 text-xs">
			<Sparkles className="size-3" />
			AI extracted
		</span>
	);
}

const TRUNCATE_AT = 180;

function ExperienceEntry({
	entry,
	onUpdate,
	onRemove,
	isLast,
	autoEdit,
}: {
	entry: Experience;
	onUpdate: (updated: Experience) => void;
	onRemove: () => void;
	isLast: boolean;
	autoEdit?: boolean;
}) {
	const [editing, setEditing] = useState(autoEdit ?? false);
	const [draft, setDraft] = useState(entry);
	const [expanded, setExpanded] = useState(false);

	const commit = () => {
		onUpdate(draft);
		setEditing(false);
	};
	const discard = () => {
		setDraft(entry);
		setEditing(false);
	};

	const tech = extractTech(entry.description);
	const confidence = getConfidence(entry);
	const isLongDesc = (entry.description?.length ?? 0) > TRUNCATE_AT;
	const displayDesc =
		expanded || !isLongDesc
			? entry.description
			: entry.description?.slice(0, TRUNCATE_AT) + '…';

	if (editing) {
		return (
			<div className="flex gap-4">
				<div className="flex shrink-0 flex-col items-center">
					<div className="bg-accent/50 ring-accent/20 ring-offset-background mt-1.5 size-2 shrink-0 rounded-full ring-2 ring-offset-2" />
					{!isLast && <div className="bg-border/40 mt-2 min-h-8 w-px flex-1" />}
				</div>
				<div className={cn('flex-1', !isLast && 'pb-8')}>
					<div className="border-border/50 bg-card flex flex-col gap-3 rounded-xl border p-4 shadow-[0_2px_8px_rgba(0,0,0,0.03)]">
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
									onChange={(e) =>
										setDraft({ ...draft, company: e.target.value })
									}
									className="h-8 text-sm"
								/>
							</div>
							<div className="col-span-2 flex flex-col gap-1">
								<label className="text-muted-foreground text-xs">
									Duration
								</label>
								<DurationRangePicker
									value={draft.duration}
									onChange={(v) => setDraft({ ...draft, duration: v })}
								/>
							</div>
							<div className="col-span-2 flex flex-col gap-1">
								<label className="text-muted-foreground text-xs">
									Description
								</label>
								<textarea
									value={draft.description ?? ''}
									onChange={(e) =>
										setDraft({
											...draft,
											description: e.target.value || undefined,
										})
									}
									className="border-border/50 bg-muted/40 text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 min-h-[80px] w-full rounded-lg border px-3 py-2 text-sm outline-none focus-visible:ring-[3px]"
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
				</div>
			</div>
		);
	}

	return (
		<div className="group/entry flex gap-4">
			<div className="flex shrink-0 flex-col items-center">
				<div className="bg-accent/50 ring-accent/20 ring-offset-background mt-1.5 size-2 shrink-0 rounded-full ring-2 ring-offset-2" />
				{!isLast && <div className="bg-border/40 mt-2 min-h-8 w-px flex-1" />}
			</div>

			<div className={cn('min-w-0 flex-1', !isLast && 'pb-8')}>
				<div className="flex items-start justify-between gap-2">
					<div className="min-w-0 flex-1">
						<p className="text-foreground text-base font-medium leading-tight">
							{entry.role}
						</p>
						<p className="text-muted-foreground mt-0.5 text-sm">
							{entry.company}
							{entry.duration && (
								<span className="text-muted-foreground/60">
									{' '}
									· {entry.duration}
								</span>
							)}
						</p>
					</div>
					<div className="flex shrink-0 items-center gap-2 pt-0.5">
						<ConfidenceBadge state={confidence} />
						<div className="flex items-center gap-1 opacity-0 transition-opacity group-hover/entry:opacity-100">
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
				</div>

				{entry.description && (
					<div className="mt-3">
						<p className="text-muted-foreground/70 text-sm leading-relaxed">
							{displayDesc}
						</p>
						{isLongDesc && (
							<button
								type="button"
								onClick={() => setExpanded(!expanded)}
								className="text-accent/60 hover:text-accent mt-1 text-xs transition-colors"
							>
								{expanded ? 'Show less' : 'Show more'}
							</button>
						)}
					</div>
				)}

				{tech.length > 0 && (
					<div className="mt-3 flex flex-wrap gap-1.5">
						{tech.map((t) => (
							<span
								key={t}
								className="bg-muted/70 text-muted-foreground/70 rounded-md px-2 py-0.5 text-xs"
							>
								{t}
							</span>
						))}
					</div>
				)}
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
	const [newIndex, setNewIndex] = useState<number | null>(null);

	const update = (index: number, updated: Experience) => {
		const next = [...experience];
		next[index] = updated;
		onChange(next);
		if (index === newIndex) setNewIndex(null);
	};
	const remove = (index: number) => {
		onChange(experience.filter((_, i) => i !== index));
		if (index === newIndex) setNewIndex(null);
	};
	const add = () => {
		const next = [
			...experience,
			{ company: '', role: '', duration: '', description: '' },
		];
		onChange(next);
		setNewIndex(next.length - 1);
	};

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
		<div className="flex flex-col">
			{experience.map((entry, i) => (
				<ExperienceEntry
					key={`exp-${i}`}
					entry={entry}
					onUpdate={(updated) => update(i, updated)}
					onRemove={() => remove(i)}
					isLast={i === experience.length - 1}
					autoEdit={i === newIndex}
				/>
			))}
			<button
				type="button"
				onClick={add}
				className="text-muted-foreground/50 hover:text-muted-foreground ml-6 mt-1 flex items-center gap-1 self-start text-sm transition-colors"
			>
				<Plus className="size-3.5" />
				Add position
			</button>
		</div>
	);
}
