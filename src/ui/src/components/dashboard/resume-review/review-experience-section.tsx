import { useRef, useState } from 'react';
import { Check, Pencil, Plus, Sparkles, Trash2, X } from 'lucide-react';
import type { ResumeExtractionType } from '@uppler/types';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

type WorkEntry = ResumeExtractionType['work_history'][number];

type ConfidenceState = 'good' | 'review' | 'extracted';

function getConfidence(entry: WorkEntry): ConfidenceState {
	const hasCore = entry.role && entry.company && entry.start_date.raw;
	const hasDetail = entry.bullet_points.length >= 2;
	if (hasCore && hasDetail) return 'good';
	if (hasCore) return 'extracted';
	return 'review';
}

function formatDateRange(entry: WorkEntry): string {
	const start = entry.start_date.raw ?? '';
	const end = entry.is_current ? 'Present' : (entry.end_date.raw ?? '');
	if (!start && !end) return '';
	return `${start} – ${end}`;
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

function TimelineConnector({ isLast }: { isLast: boolean }) {
	return (
		<div className="flex shrink-0 flex-col items-center">
			<div className="bg-accent/50 ring-accent/20 ring-offset-background mt-1.5 size-2 shrink-0 rounded-full ring-2 ring-offset-2" />
			{!isLast && <div className="bg-border/40 mt-2 min-h-8 w-px flex-1" />}
		</div>
	);
}

function ExperienceEntry({
	entry,
	onUpdate,
	onRemove,
	isLast,
	autoEdit,
}: {
	entry: WorkEntry;
	onUpdate: (updated: WorkEntry) => void;
	onRemove: () => void;
	isLast: boolean;
	autoEdit?: boolean;
}) {
	const [editing, setEditing] = useState(autoEdit ?? false);
	const [draft, setDraft] = useState(entry);
	const [error, setError] = useState<string | null>(null);

	const nextBulletId = useRef(entry.bullet_points.length);
	const makeBulletIds = (bullets: string[]) =>
		bullets.map(() => String(nextBulletId.current++));
	const bulletIdsRef = useRef<string[]>(makeBulletIds(entry.bullet_points));

	const commit = () => {
		if (!draft.role?.trim()) {
			setError('Role is required.');
			return;
		}
		if (!draft.company?.trim()) {
			setError('Company is required.');
			return;
		}
		setError(null);
		onUpdate(draft);
		setEditing(false);
	};
	const discard = () => {
		bulletIdsRef.current = makeBulletIds(entry.bullet_points);
		setDraft(entry);
		setError(null);
		setEditing(false);
	};

	const updateBullet = (i: number, value: string) => {
		const next = [...draft.bullet_points];
		next[i] = value;
		setDraft({ ...draft, bullet_points: next });
	};
	const removeBullet = (i: number) => {
		bulletIdsRef.current = bulletIdsRef.current.filter((_, idx) => idx !== i);
		setDraft({
			...draft,
			bullet_points: draft.bullet_points.filter((_, idx) => idx !== i),
		});
	};
	const addBullet = () => {
		bulletIdsRef.current = [
			...bulletIdsRef.current,
			String(nextBulletId.current++),
		];
		setDraft({ ...draft, bullet_points: [...draft.bullet_points, ''] });
	};

	const confidence = getConfidence(entry);
	const dateRange = formatDateRange(entry);

	if (editing) {
		return (
			<div className="flex gap-4">
				<TimelineConnector isLast={isLast} />
				<div className={cn('flex-1', !isLast && 'pb-8')}>
					<div className="border-border/50 bg-card flex flex-col gap-3 rounded-xl border p-4 shadow-[0_2px_8px_rgba(0,0,0,0.03)]">
						<div className="grid grid-cols-2 gap-3">
							<div className="flex flex-col gap-1">
								<label className="text-muted-foreground text-xs">Role</label>
								<Input
									value={draft.role ?? ''}
									onChange={(e) =>
										setDraft({ ...draft, role: e.target.value || null })
									}
									className="h-8 text-sm"
								/>
							</div>
							<div className="flex flex-col gap-1">
								<label className="text-muted-foreground text-xs">Company</label>
								<Input
									value={draft.company ?? ''}
									onChange={(e) =>
										setDraft({ ...draft, company: e.target.value || null })
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
									placeholder="e.g. Jan 2020"
								/>
							</div>
							<div className="flex flex-col gap-1">
								<label className="text-muted-foreground text-xs">
									End{' '}
									<span className="text-muted-foreground/50">
										(or "Present")
									</span>
								</label>
								<Input
									value={
										draft.is_current ? 'Present' : (draft.end_date.raw ?? '')
									}
									onChange={(e) => {
										const val = e.target.value;
										const isCurrent = val.toLowerCase() === 'present';
										setDraft({
											...draft,
											is_current: isCurrent,
											end_date: isCurrent
												? { raw: null, normalized: null }
												: { ...draft.end_date, raw: val || null },
										});
									}}
									className="h-8 text-sm"
									placeholder="e.g. Mar 2024 or Present"
								/>
							</div>
						</div>

						<div className="flex flex-col gap-2">
							<label className="text-muted-foreground text-xs">
								Achievements & responsibilities
							</label>
							{draft.bullet_points.map((b, i) => (
								<div
									key={bulletIdsRef.current[i]}
									className="flex items-center gap-2"
								>
									<span className="text-muted-foreground/40 text-xs">·</span>
									<Input
										value={b}
										onChange={(e) => updateBullet(i, e.target.value)}
										className="h-7 text-sm"
									/>
									<Button
										type="button"
										variant="ghost"
										size="icon"
										onClick={() => removeBullet(i)}
										className="text-muted-foreground/40 hover:text-destructive size-5 shrink-0"
									>
										<X className="size-3" />
									</Button>
								</div>
							))}
							<Button
								type="button"
								variant="ghost"
								size="sm"
								onClick={addBullet}
								className="text-muted-foreground/50 hover:text-muted-foreground h-auto gap-1 self-start p-0 text-xs"
							>
								<Plus className="size-3" />
								Add Achievement/Responsibility
							</Button>
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
				</div>
			</div>
		);
	}

	return (
		<div className="group/entry flex gap-4">
			<TimelineConnector isLast={isLast} />

			<div className={cn('min-w-0 flex-1', !isLast && 'pb-8')}>
				<div className="flex items-start justify-between gap-2">
					<div className="min-w-0 flex-1">
						<p className="text-foreground text-base font-medium leading-tight">
							{entry.role}
						</p>
						<p className="text-muted-foreground mt-0.5 text-sm">
							{entry.company}
							{dateRange && (
								<span className="text-muted-foreground/60"> · {dateRange}</span>
							)}
						</p>
					</div>
					<div className="flex shrink-0 items-center gap-2 pt-0.5">
						<ConfidenceBadge state={confidence} />
						<div className="flex items-center gap-1 opacity-0 transition-opacity group-hover/entry:opacity-100">
							<Button
								type="button"
								variant="ghost"
								size="icon"
								onClick={() => setEditing(true)}
								className="text-muted-foreground/40 hover:text-muted-foreground size-6"
								aria-label="Edit"
							>
								<Pencil className="size-3.5" />
							</Button>
							<Button
								type="button"
								variant="ghost"
								size="icon"
								onClick={onRemove}
								className="text-muted-foreground/40 hover:text-destructive size-6"
								aria-label="Remove"
							>
								<Trash2 className="size-3.5" />
							</Button>
						</div>
					</div>
				</div>

				{entry.bullet_points.length > 0 && (
					<ul className="mt-3 flex flex-col gap-1">
						{entry.bullet_points.map((b, i) => (
							<li
								key={bulletIdsRef.current[i]}
								className="text-muted-foreground/70 flex gap-2 text-sm leading-relaxed"
							>
								<span className="mt-1.5 size-1 shrink-0 rounded-full bg-current opacity-40" />
								{b}
							</li>
						))}
					</ul>
				)}
			</div>
		</div>
	);
}

interface ReviewExperienceSectionProps {
	experience: WorkEntry[];
	onChange: (updated: WorkEntry[]) => void;
}

export function ReviewExperienceSection({
	experience,
	onChange,
}: ReviewExperienceSectionProps) {
	const [newIndex, setNewIndex] = useState<number | null>(null);

	const update = (index: number, updated: WorkEntry) => {
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
		const blank: WorkEntry = {
			company: null,
			role: null,
			start_date: { raw: null, normalized: null },
			end_date: { raw: null, normalized: null },
			is_current: false,
			bullet_points: [],
		};
		const next = [...experience, blank];
		onChange(next);
		setNewIndex(next.length - 1);
	};

	if (experience.length === 0) {
		return (
			<Button
				type="button"
				variant="outline"
				onClick={add}
				className="w-full gap-1.5 rounded-xl border-dashed py-4"
			>
				<Plus className="size-4" />
				Add experience
			</Button>
		);
	}

	return (
		<div className="flex flex-col">
			{experience.map((entry, i) => (
				<ExperienceEntry
					key={`${entry.company ?? ''}-${entry.role ?? ''}`}
					entry={entry}
					onUpdate={(updated) => update(i, updated)}
					onRemove={() => remove(i)}
					isLast={i === experience.length - 1}
					autoEdit={i === newIndex}
				/>
			))}
			<Button
				type="button"
				variant="ghost"
				size="sm"
				onClick={add}
				className="text-muted-foreground/50 hover:text-muted-foreground ml-6 mt-1 gap-1 self-start text-sm"
			>
				<Plus className="size-3.5" />
				Add position
			</Button>
		</div>
	);
}
