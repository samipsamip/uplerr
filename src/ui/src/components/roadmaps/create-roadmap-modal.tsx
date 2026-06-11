import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router';
import { ArrowRight, Check, Loader2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { useMutation, useQuery } from '@tanstack/react-query';
import type { JobAnalysisResultType } from '@uppler/types';

import { BrandIcon } from '@/components/dashboard/brand-icon';
import { Button } from '@/components/ui/button';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogOverlay,
	DialogTitle,
} from '@/components/ui/dialog';
import { getSkillIcon } from '@/lib/skill-icon';
import { cn } from '@/lib/utils';
import {
	getRoadmapGenerationStatus,
	postStartRoadmapGeneration,
} from '@/network/roadmaps.service';
import {
	getScrapingJobStatus,
	type JobState,
	postStartScraping,
} from '@/network/scraper.service';

import CreateRoadmapTabs from './create-roadmaps-tab';

export type RoadmapFormValues = {
	jobDescriptionURL: string;
	rawJobDescriptionText: string;
};

type Step = 'input' | 'review' | 'generating';

// ---------------------------------------------------------------------------
// Scrape stage labels
// ---------------------------------------------------------------------------

const SCRAPE_STAGE_LABELS: Record<string, string> = {
	validating: 'Validating URL...',
	'checking-cache': 'Checking cache...',
	fetching: 'Fetching job page...',
	extracting: 'Extracting job details...',
	'analyzing-skills': 'Analysing skill requirements...',
	'deep-loading': 'Loading page content...',
};

function getScrapeLabel(jobStatus: JobState | undefined): string {
	if (!jobStatus || jobStatus.status === 'pending') return 'Getting ready...';
	if (jobStatus.status === 'processing') {
		return SCRAPE_STAGE_LABELS[jobStatus.stage] ?? 'Processing...';
	}
	return 'Processing...';
}

// ---------------------------------------------------------------------------
// Skill chip components (inline — same design as before)
// ---------------------------------------------------------------------------

const LEVEL_ORDER = ['none', 'beginner', 'intermediate', 'advanced', 'expert'];
type Bucket = 'ready' | 'improve' | 'missing';

function getBucket(u: string, r: string): Bucket {
	if (u === 'none') return 'missing';
	return LEVEL_ORDER.indexOf(u) >= LEVEL_ORDER.indexOf(r) ? 'ready' : 'improve';
}

function ReadyChip({ name }: { name: string }) {
	const icon = getSkillIcon(name);
	return (
		<span className="border-accent/20 bg-accent/[0.07] inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-sm font-medium">
			{icon && <BrandIcon name={icon} size={13} className="shrink-0" />}
			{name}
		</span>
	);
}

function ImproveChip({
	name,
	userLevel,
	requiredLevel,
}: {
	name: string;
	userLevel: string;
	requiredLevel: string;
}) {
	const icon = getSkillIcon(name);
	return (
		<span className="border-border/50 bg-card inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-sm font-medium">
			{icon && <BrandIcon name={icon} size={13} className="shrink-0" />}
			{name}
			<span className="text-muted-foreground/50 shrink-0 font-mono text-[10px]">
				{userLevel} → {requiredLevel}
			</span>
		</span>
	);
}

function MissingChip({ name }: { name: string }) {
	const icon = getSkillIcon(name);
	return (
		<span className="border-border/30 bg-muted/20 text-muted-foreground/60 inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs">
			{icon && (
				<BrandIcon name={icon} size={11} className="shrink-0 opacity-60" />
			)}
			{name}
		</span>
	);
}

// ---------------------------------------------------------------------------
// Generation progress checklist
// ---------------------------------------------------------------------------

const GEN_STAGES = [
	{
		key: 'generating',
		label: 'Writing your learning roadmap',
		sub: '20–40 seconds',
	},
	{ key: 'saving', label: 'Saving your roadmap' },
] as const;

function GenerationProgress({ stage }: { stage: string | null }) {
	const activeIdx = stage ? GEN_STAGES.findIndex((s) => s.key === stage) : -1;
	return (
		<div className="flex flex-col gap-3">
			{GEN_STAGES.map((s, i) => {
				const done = activeIdx > i;
				const active = activeIdx === i;
				return (
					<div key={s.key} className="flex items-center gap-3">
						<div
							className={cn(
								'flex size-5 shrink-0 items-center justify-center rounded-full border-2 transition-all',
								done
									? 'border-accent bg-accent text-white'
									: active
										? 'border-accent'
										: 'border-border/30',
							)}
						>
							{done ? (
								<Check className="size-3" />
							) : active ? (
								<Loader2 className="text-accent size-3 animate-spin" />
							) : null}
						</div>
						<span
							className={cn(
								'text-sm transition-colors',
								done
									? 'text-muted-foreground line-through'
									: active
										? 'font-medium'
										: 'text-muted-foreground/40',
							)}
						>
							{s.label}
							{'sub' in s && active && (
								<span className="text-muted-foreground ml-1.5 text-xs font-normal">
									· {s.sub}
								</span>
							)}
						</span>
					</div>
				);
			})}
		</div>
	);
}

// ---------------------------------------------------------------------------
// Modal
// ---------------------------------------------------------------------------

type CreateRoadMapModalProps = {
	open: boolean;
	setOpen: (open: boolean) => void;
};

export default function CreateRoadMapModal({
	open,
	setOpen,
}: CreateRoadMapModalProps) {
	const navigate = useNavigate();

	const [step, setStep] = useState<Step>('input');
	const [activeTab, setActiveTab] = useState<'url' | 'text'>('url');
	const [scrapeJobId, setScrapeJobId] = useState<string | null>(null);
	const [genJobId, setGenJobId] = useState<string | null>(null);
	const [result, setResult] = useState<JobAnalysisResultType | null>(null);
	const [weeklyHours, setWeeklyHours] = useState(10);
	const [timelineTarget, setTimelineTarget] = useState<string | null>(null);

	const form = useForm<RoadmapFormValues>({
		defaultValues: { jobDescriptionURL: '', rawJobDescriptionText: '' },
	});

	// Reset all state when modal closes
	useEffect(() => {
		if (!open) {
			setStep('input');
			setScrapeJobId(null);
			setGenJobId(null);
			setResult(null);
			setWeeklyHours(10);
			setTimelineTarget(null);
			form.reset();
		}
	}, [open, form]);

	// ---------------------------------------------------------------------------
	// Step 1 — scraping
	// ---------------------------------------------------------------------------

	const startMutation = useMutation({
		mutationFn: postStartScraping,
		onSuccess: ({ jobId }) => setScrapeJobId(jobId),
		onError: () =>
			toast.error('Failed to analyse the job listing. Please try again.'),
	});

	const { data: scrapeStatus } = useQuery({
		queryKey: ['scraper-job', scrapeJobId],
		queryFn: () => getScrapingJobStatus(scrapeJobId!),
		enabled: !!scrapeJobId,
		refetchInterval: (q) => {
			const s = q.state.data?.status;
			if (s === 'done' || s === 'error') return false;
			return 1000;
		},
	});

	useEffect(() => {
		if (!scrapeStatus) return;
		if (scrapeStatus.status === 'done') {
			setResult(scrapeStatus.result);
			setStep('review');
		}
		if (scrapeStatus.status === 'error') {
			toast.error(
				'Could not extract job details. Check the URL and try again.',
			);
			setScrapeJobId(null);
		}
	}, [scrapeStatus]);

	// ---------------------------------------------------------------------------
	// Step 2 — generation
	// ---------------------------------------------------------------------------

	const generateMutation = useMutation({
		mutationFn: postStartRoadmapGeneration,
		onSuccess: ({ jobId }) => {
			setGenJobId(jobId);
			setStep('generating');
		},
		onError: () =>
			toast.error('Failed to start roadmap generation. Please try again.'),
	});

	const { data: genStatus } = useQuery({
		queryKey: ['roadmap-generation', genJobId],
		queryFn: () => getRoadmapGenerationStatus(genJobId!),
		enabled: !!genJobId,
		refetchInterval: (q) => {
			const s = q.state.data?.status;
			if (s === 'done' || s === 'error') return false;
			return 1500;
		},
	});

	useEffect(() => {
		if (!genStatus) return;
		if (genStatus.status === 'done') {
			setOpen(false);
			void navigate(`/roadmaps/view/${genStatus.planId}`);
		}
		if (genStatus.status === 'error') {
			toast.error('Roadmap generation failed. Please try again.');
			setGenJobId(null);
			setStep('review');
		}
	}, [genStatus, navigate, setOpen]);

	// ---------------------------------------------------------------------------
	// Form submission
	// ---------------------------------------------------------------------------

	const isScraping =
		startMutation.isPending ||
		(!!scrapeJobId &&
			scrapeStatus?.status !== 'done' &&
			scrapeStatus?.status !== 'error');

	const handleTabChange = (tab: 'url' | 'text') => {
		setActiveTab(tab);
		form.clearErrors();
		if (tab === 'url') form.setValue('rawJobDescriptionText', '');
		else form.setValue('jobDescriptionURL', '');
	};

	const onSubmit = form.handleSubmit((values) => {
		if (activeTab === 'url') {
			if (!values.jobDescriptionURL) {
				form.setError('jobDescriptionURL', {
					message: 'Please enter a job URL.',
				});
				return;
			}
			startMutation.mutate({
				hasUrl: true,
				jobDescriptionURL: values.jobDescriptionURL,
			});
		} else {
			if (!values.rawJobDescriptionText) {
				form.setError('rawJobDescriptionText', {
					message: 'Please paste a job description.',
				});
				return;
			}
			startMutation.mutate({
				hasUrl: false,
				rawJobDescriptionText: values.rawJobDescriptionText,
			});
		}
	});

	// ---------------------------------------------------------------------------
	// Derived review data
	// ---------------------------------------------------------------------------

	const ready =
		result?.skills.filter(
			(s) => getBucket(s.user_level, s.required_level) === 'ready',
		) ?? [];
	const improve =
		result?.skills.filter(
			(s) => getBucket(s.user_level, s.required_level) === 'improve',
		) ?? [];
	const missing =
		result?.skills.filter(
			(s) => getBucket(s.user_level, s.required_level) === 'missing',
		) ?? [];
	const total = result?.skills.length ?? 0;
	const matchPct =
		total > 0
			? Math.round(((ready.length + improve.length * 0.5) / total) * 100)
			: 0;
	const coveragePct =
		total > 0 ? Math.round(((ready.length + improve.length) / total) * 100) : 0;

	const currentGenStage =
		genStatus?.status === 'processing' ? genStatus.stage : null;

	// ---------------------------------------------------------------------------
	// Render
	// ---------------------------------------------------------------------------

	return (
		<Dialog open={open} onOpenChange={setOpen} modal>
			<DialogOverlay>
				<DialogContent className="sm:max-w-xl">
					{/* ── Step: input ─────────────────────────────────────────── */}
					{step === 'input' && (
						<>
							<DialogHeader>
								<DialogTitle>Generate Your Learning Roadmap</DialogTitle>
								<DialogDescription>
									Paste a job description or job link to generate a personalised
									learning path.
								</DialogDescription>
							</DialogHeader>

							<form onSubmit={onSubmit}>
								<div className="relative">
									{isScraping && (
										<div className="bg-background/80 absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 rounded-lg backdrop-blur-sm">
											<Loader2 className="text-primary h-5 w-5 animate-spin" />
											<p className="text-muted-foreground text-sm">
												{getScrapeLabel(scrapeStatus)}
											</p>
										</div>
									)}
									<CreateRoadmapTabs
										activeTab={activeTab}
										onTabChange={handleTabChange}
										register={form.register}
										errors={form.formState.errors}
									/>
									<Button
										type="submit"
										disabled={isScraping}
										className="mt-4 w-full"
									>
										{isScraping ? (
											<>
												<Loader2 className="mr-2 h-4 w-4 animate-spin" />
												{getScrapeLabel(scrapeStatus)}
											</>
										) : (
											'Analyse Job'
										)}
									</Button>
								</div>
							</form>
						</>
					)}

					{/* ── Step: review ────────────────────────────────────────── */}
					{step === 'review' && result && (
						<>
							<DialogHeader>
								<DialogTitle className="leading-tight">
									{result.job_title ?? 'Job Requirements'}
								</DialogTitle>
								{result.company && (
									<DialogDescription>{result.company}</DialogDescription>
								)}
							</DialogHeader>

							{/* Match hero */}
							<div className="mt-1">
								<div className="flex items-baseline gap-2">
									<span className="text-3xl font-semibold tracking-tight">
										{matchPct}%
									</span>
									<span className="text-muted-foreground text-sm">match</span>
								</div>
								<div className="bg-muted mt-2 h-2 overflow-hidden rounded-full">
									<div className="flex h-full">
										<div
											className="bg-accent h-full rounded-full transition-all duration-500"
											style={{ width: `${matchPct}%` }}
										/>
										<div
											className="bg-accent/25 h-full transition-all duration-500"
											style={{ width: `${coveragePct - matchPct}%` }}
										/>
									</div>
								</div>
								<p className="text-muted-foreground mt-1.5 text-xs">
									<span className="text-accent font-medium">
										{ready.length} ready
									</span>
									<span className="mx-2 opacity-30">·</span>
									<span className="text-foreground/70 font-medium">
										{improve.length} to improve
									</span>
									<span className="mx-2 opacity-30">·</span>
									<span>{missing.length} missing</span>
								</p>
							</div>

							<div className="border-border/30 border-t" />

							{/* Skill groups */}
							<div className="max-h-[40vh] overflow-y-auto">
								<div className="flex flex-col gap-4">
									{ready.length > 0 && (
										<div>
											<p className="text-muted-foreground/40 mb-2 text-[10px] font-semibold uppercase tracking-widest">
												Ready · {ready.length}
											</p>
											<div className="flex flex-wrap gap-1.5">
												{ready.map((s) => (
													<ReadyChip key={s.name} name={s.name} />
												))}
											</div>
										</div>
									)}
									{improve.length > 0 && (
										<div>
											<p className="text-muted-foreground/40 mb-2 text-[10px] font-semibold uppercase tracking-widest">
												Needs improvement · {improve.length}
											</p>
											<div className="flex flex-wrap gap-1.5">
												{improve.map((s) => (
													<ImproveChip
														key={s.name}
														name={s.name}
														userLevel={s.user_level}
														requiredLevel={s.required_level}
													/>
												))}
											</div>
										</div>
									)}
									{missing.length > 0 && (
										<div>
											<p className="text-muted-foreground/40 mb-2 text-[10px] font-semibold uppercase tracking-widest">
												Missing · {missing.length}
											</p>
											<div className="flex flex-wrap gap-1.5">
												{missing.map((s) => (
													<MissingChip key={s.name} name={s.name} />
												))}
											</div>
										</div>
									)}
								</div>
							</div>

							{/* Preferences row */}
							<div className="border-border/30 border-t pt-4">
								<p className="text-muted-foreground/40 mb-3 text-[10px] font-semibold uppercase tracking-widest">
									Study preferences
								</p>
								<div className="flex items-center gap-4">
									{/* Hours per week */}
									<div className="flex-1">
										<p className="text-muted-foreground mb-1.5 text-xs">
											Hours / week
										</p>
										<div className="flex gap-1">
											{[5, 10, 15, 20].map((h) => (
												<button
													key={h}
													type="button"
													onClick={() => setWeeklyHours(h)}
													className={cn(
														'flex-1 rounded-lg border px-2 py-1.5 text-xs font-medium transition-colors',
														weeklyHours === h
															? 'border-accent bg-accent/[0.08] text-accent'
															: 'border-border/50 bg-card text-muted-foreground hover:border-border',
													)}
												>
													{h}h
												</button>
											))}
										</div>
									</div>

									{/* Timeline target */}
									<div className="flex-1">
										<p className="text-muted-foreground mb-1.5 text-xs">
											Target timeline
										</p>
										<div className="grid grid-cols-2 gap-1">
											{[
												{ label: 'None', value: null },
												{ label: '3 months', value: '3 months' },
												{ label: '6 months', value: '6 months' },
												{ label: '1 year', value: '1 year' },
											].map(({ label, value }) => (
												<button
													key={label}
													type="button"
													onClick={() => setTimelineTarget(value)}
													className={cn(
														'rounded-lg border px-2 py-1.5 text-xs font-medium transition-colors',
														timelineTarget === value
															? 'border-accent bg-accent/[0.08] text-accent'
															: 'border-border/50 bg-card text-muted-foreground hover:border-border',
													)}
												>
													{label}
												</button>
											))}
										</div>
									</div>
								</div>
							</div>

							<Button
								size="lg"
								className="w-full"
								disabled={generateMutation.isPending}
								onClick={() =>
									generateMutation.mutate({
										...result,
										weekly_hours: weeklyHours,
										timeline_target: timelineTarget,
									})
								}
							>
								{generateMutation.isPending ? (
									<Loader2 className="h-4 w-4 animate-spin" />
								) : (
									<>
										Generate My Roadmap <ArrowRight className="ml-2 h-4 w-4" />
									</>
								)}
							</Button>
						</>
					)}

					{/* ── Step: generating ────────────────────────────────────── */}
					{step === 'generating' && (
						<>
							<DialogHeader>
								<DialogTitle className="flex items-center gap-2">
									<div className="bg-accent/[0.08] flex size-7 items-center justify-center rounded-xl">
										<Sparkles className="text-accent size-3.5" />
									</div>
									Building your roadmap
								</DialogTitle>
								<DialogDescription>
									{result?.job_title
										? `Personalised for ${result.job_title}${result.company ? ` · ${result.company}` : ''}`
										: 'Analysing your skill gaps and curating learning resources'}
								</DialogDescription>
							</DialogHeader>

							<div className="py-2">
								<GenerationProgress stage={currentGenStage} />
							</div>
						</>
					)}
				</DialogContent>
			</DialogOverlay>
		</Dialog>
	);
}
