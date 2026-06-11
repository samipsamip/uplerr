import { useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router';
import {
	ArrowLeft,
	BookOpen,
	ChevronDown,
	Clock,
	Code2,
	ExternalLink,
	Layers,
	Link,
	Loader2,
	Plus,
	Sparkles,
	Trash2,
	Zap,
} from 'lucide-react';
import { toast } from 'sonner';

import { TopBar } from '@/components/dashboard/top-bar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import {
	useAddSubtopicResource,
	useDeleteRoadmap,
	useGetRoadmap,
	useUpdateRoadmapStatus,
} from '@/query/roadmaps.query';

import Layout from './Layout';

// ---------------------------------------------------------------------------
// Status badge + picker
// ---------------------------------------------------------------------------

type RoadmapStatus = 'active' | 'completed' | 'archived';

const STATUS_CONFIG: Record<RoadmapStatus, { label: string; dot: string }> = {
	active: { label: 'Active', dot: 'bg-accent' },
	completed: { label: 'Completed', dot: 'bg-emerald-500' },
	archived: { label: 'Archived', dot: 'bg-muted-foreground/40' },
};

function StatusPicker({
	current,
	planId,
}: {
	current: RoadmapStatus;
	planId: string;
}) {
	const { mutate: updateStatus, isPending } = useUpdateRoadmapStatus(planId);
	const config = STATUS_CONFIG[current];

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<button
					type="button"
					disabled={isPending}
					className="border-border/50 bg-card hover:border-border hover:bg-muted/40 flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors disabled:opacity-50"
				>
					<span className={cn('size-1.5 rounded-full', config.dot)} />
					{config.label}
					<ChevronDown className="text-muted-foreground/50 size-3" />
				</button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="w-36">
				{(
					Object.entries(STATUS_CONFIG) as [RoadmapStatus, typeof config][]
				).map(([status, cfg]) => (
					<DropdownMenuItem
						key={status}
						disabled={status === current}
						className="gap-2"
						onClick={() => updateStatus(status)}
					>
						<span className={cn('size-1.5 rounded-full', cfg.dot)} />
						{cfg.label}
					</DropdownMenuItem>
				))}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

// ---------------------------------------------------------------------------
// Search query link
// ---------------------------------------------------------------------------

const QUERY_INTENT = [
	{ label: 'Concept', icon: BookOpen },
	{ label: 'Tutorial', icon: Code2 },
	{ label: 'Advanced', icon: Zap },
] as const;

function SearchQueryLink({ query, index }: { query: string; index: number }) {
	const href = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
	const intent = QUERY_INTENT[index] ?? QUERY_INTENT[0];
	const Icon = intent.icon;

	return (
		<a
			href={href}
			target="_blank"
			rel="noopener noreferrer"
			className="border-border/20 bg-muted/20 hover:border-accent/20 hover:bg-accent/[0.04] group flex items-center gap-3 rounded-lg border px-3 py-2 text-xs transition-all"
		>
			<span className="text-muted-foreground/40 group-hover:text-accent/70 flex w-14 shrink-0 items-center gap-1.5 text-[10px] font-medium transition-colors">
				<Icon className="size-3 shrink-0" />
				{intent.label}
			</span>
			<span className="text-foreground/60 group-hover:text-foreground min-w-0 flex-1 truncate transition-colors">
				{query}
			</span>
			<ExternalLink className="text-muted-foreground/20 group-hover:text-accent/50 size-3 shrink-0 transition-colors" />
		</a>
	);
}

function UserResourceLink({ title, url }: { title: string; url: string }) {
	return (
		<a
			href={url}
			target="_blank"
			rel="noopener noreferrer"
			className="border-accent/15 bg-accent/[0.04] hover:border-accent/30 hover:bg-accent/[0.08] group flex items-center gap-3 rounded-lg border px-3 py-2 text-xs transition-all"
		>
			<span className="text-accent/50 group-hover:text-accent flex w-14 shrink-0 items-center gap-1.5 text-[10px] font-medium transition-colors">
				<Link className="size-3 shrink-0" />
				Mine
			</span>
			<span className="text-foreground/60 group-hover:text-foreground min-w-0 flex-1 truncate transition-colors">
				{title}
			</span>
			<ExternalLink className="text-muted-foreground/20 group-hover:text-accent/50 size-3 shrink-0 transition-colors" />
		</a>
	);
}

// ---------------------------------------------------------------------------
// Subtopic card
// ---------------------------------------------------------------------------

type Subtopic = {
	title: string;
	description: string;
	search_queries: string[];
	user_resources?: { title: string; url: string }[];
};

function SubtopicCard({
	subtopic,
	topicOrder,
	planId,
}: {
	subtopic: Subtopic;
	topicOrder: number;
	planId: string;
}) {
	const [open, setOpen] = useState(false);
	const [addingResource, setAddingResource] = useState(false);
	const [resourceTitle, setResourceTitle] = useState('');
	const [resourceUrl, setResourceUrl] = useState('');

	const { mutate: addResource, isPending: isAdding } =
		useAddSubtopicResource(planId);

	const handleAddResource = () => {
		const url = resourceUrl.trim();
		const title = resourceTitle.trim() || url;

		if (!url) {
			toast.error('Please enter a URL.');
			return;
		}

		try {
			new URL(url);
		} catch {
			toast.error('Please enter a valid URL.');
			return;
		}

		addResource(
			{
				topic_order: topicOrder,
				subtopic_title: subtopic.title,
				resource: { title, url },
			},
			{
				onSuccess: () => {
					setResourceTitle('');
					setResourceUrl('');
					setAddingResource(false);
				},
			},
		);
	};

	return (
		<div
			className={cn(
				'overflow-hidden rounded-xl border transition-colors',
				open
					? 'border-accent/20 bg-accent/[0.025]'
					: 'border-border/30 bg-card',
			)}
		>
			<button
				type="button"
				onClick={() => setOpen((p) => !p)}
				className="flex w-full items-start gap-3 px-4 py-3 text-left"
			>
				<div
					className={cn(
						'mt-[5px] size-2 shrink-0 rounded-full border-2 transition-all',
						open ? 'border-accent bg-accent/40 scale-110' : 'border-border/40',
					)}
				/>
				<div className="min-w-0 flex-1">
					<p className="text-sm font-medium leading-snug">{subtopic.title}</p>
					<p className="text-muted-foreground mt-0.5 text-xs leading-relaxed">
						{subtopic.description}
					</p>
				</div>
				<ChevronDown
					className={cn(
						'text-muted-foreground/30 mt-0.5 size-3.5 shrink-0 transition-transform',
						open && 'rotate-180',
					)}
				/>
			</button>

			{open && (
				<div className="border-border/20 border-t px-4 pb-3 pt-2.5">
					{/* AI search queries */}
					<p className="text-muted-foreground/30 mb-2 text-[10px] font-semibold uppercase tracking-widest">
						Search resources
					</p>
					<div className="flex flex-col gap-1.5">
						{subtopic.search_queries.map((q, i) => (
							<SearchQueryLink key={q} query={q} index={i} />
						))}
					</div>

					{/* User resources */}
					{subtopic.user_resources && subtopic.user_resources.length > 0 && (
						<>
							<p className="text-muted-foreground/30 mb-2 mt-3 text-[10px] font-semibold uppercase tracking-widest">
								Your resources
							</p>
							<div className="flex flex-col gap-1.5">
								{subtopic.user_resources.map((r) => (
									<UserResourceLink key={r.url} title={r.title} url={r.url} />
								))}
							</div>
						</>
					)}

					{/* Add resource form */}
					<div className="mt-3">
						{addingResource ? (
							<div className="flex flex-col gap-2">
								<Input
									placeholder="URL (required)"
									value={resourceUrl}
									onChange={(e) => setResourceUrl(e.target.value)}
									className="h-8 text-xs"
									onKeyDown={(e) => e.key === 'Enter' && handleAddResource()}
								/>
								<Input
									placeholder="Title (optional)"
									value={resourceTitle}
									onChange={(e) => setResourceTitle(e.target.value)}
									className="h-8 text-xs"
									onKeyDown={(e) => e.key === 'Enter' && handleAddResource()}
								/>
								<div className="flex gap-2">
									<Button
										size="sm"
										className="h-7 text-xs"
										onClick={handleAddResource}
										disabled={isAdding}
									>
										{isAdding ? (
											<Loader2 className="size-3 animate-spin" />
										) : (
											'Add'
										)}
									</Button>
									<Button
										size="sm"
										variant="ghost"
										className="h-7 text-xs"
										onClick={() => {
											setAddingResource(false);
											setResourceTitle('');
											setResourceUrl('');
										}}
									>
										Cancel
									</Button>
								</div>
							</div>
						) : (
							<button
								type="button"
								onClick={() => setAddingResource(true)}
								className="text-muted-foreground/40 hover:text-accent flex items-center gap-1.5 text-[11px] transition-colors"
							>
								<Plus className="size-3" />
								Add resource
							</button>
						)}
					</div>
				</div>
			)}
		</div>
	);
}

// ---------------------------------------------------------------------------
// Topic row — timeline style
// ---------------------------------------------------------------------------

type Topic = {
	title: string;
	order: number;
	rationale: string;
	estimated_weeks: number;
	subtopics: Subtopic[];
};

function TopicRow({
	topic,
	defaultOpen,
	isLast,
	planId,
}: {
	topic: Topic;
	defaultOpen: boolean;
	isLast: boolean;
	planId: string;
}) {
	const [open, setOpen] = useState(defaultOpen);

	return (
		<div className="relative flex gap-5">
			{!isLast && (
				<div
					className={cn(
						'absolute bottom-0 left-[15px] top-8 w-px transition-colors',
						open ? 'bg-accent/20' : 'bg-border/30',
					)}
				/>
			)}

			<div
				className={cn(
					'relative z-10 mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full border-2 transition-all',
					open
						? 'border-accent bg-accent/[0.08] shadow-[0_0_0_4px_rgba(99,102,241,0.06)]'
						: 'border-border/50 bg-card',
				)}
			>
				<span
					className={cn(
						'font-mono text-xs font-semibold transition-colors',
						open ? 'text-accent' : 'text-muted-foreground/50',
					)}
				>
					{topic.order}
				</span>
			</div>

			<div className="flex-1 pb-8">
				<button
					type="button"
					onClick={() => setOpen((p) => !p)}
					className="group flex w-full items-start justify-between gap-3 text-left"
				>
					<div className="min-w-0 flex-1">
						<p className="group-hover:text-accent text-sm font-semibold leading-snug transition-colors">
							{topic.title}
						</p>
						<p className="text-muted-foreground/60 mt-0.5 text-xs leading-relaxed">
							{topic.rationale}
						</p>
					</div>

					<div className="flex shrink-0 items-center gap-2 pt-0.5">
						<span className="bg-muted/60 text-muted-foreground inline-flex items-center gap-1 rounded-md px-2 py-0.5 font-mono text-[10px]">
							<Clock className="size-2.5" />~{topic.estimated_weeks}w
						</span>
						<span className="text-muted-foreground hidden text-[10px] sm:inline">
							{topic.subtopics.length} subtopic
							{topic.subtopics.length !== 1 ? 's' : ''}
						</span>
						<ChevronDown
							className={cn(
								'text-muted-foreground/30 size-3.5 transition-transform',
								open && 'rotate-180',
							)}
						/>
					</div>
				</button>

				{open && (
					<div className="mt-3 flex flex-col gap-2">
						{topic.subtopics.map((subtopic) => (
							<SubtopicCard
								key={subtopic.title}
								subtopic={subtopic}
								topicOrder={topic.order}
								planId={planId}
							/>
						))}
					</div>
				)}
			</div>
		</div>
	);
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function RoadmapView() {
	const { planId } = useParams<{ planId: string }>();
	const navigate = useNavigate();
	const [confirmDelete, setConfirmDelete] = useState(false);

	const { data, isLoading, isError } = useGetRoadmap(planId!);
	const { mutate: deleteMutate, isPending: isDeleting } = useDeleteRoadmap();
	const currentStatus = (data?.status ?? 'active') as RoadmapStatus;

	if (!planId) return <Navigate to="/roadmaps" replace />;

	if (isLoading) {
		return (
			<Layout>
				<TopBar title="Roadmap" />
				<div className="flex flex-1 items-center justify-center p-8">
					<Loader2 className="text-muted-foreground h-5 w-5 animate-spin" />
				</div>
			</Layout>
		);
	}

	if (isError || !data) return <Navigate to="/roadmaps" replace />;

	const { roadmap, job_title: jobTitle, company } = data;
	const totalSubtopics =
		roadmap.topics?.reduce((n, t) => n + t.subtopics.length, 0) ?? 0;
	const topics = roadmap.topics ?? [];

	const handleDelete = () => {
		if (!confirmDelete) {
			setConfirmDelete(true);
			return;
		}
		deleteMutate(planId, {
			onSuccess: () => void navigate('/roadmaps'),
		});
	};

	return (
		<Layout>
			<TopBar
				title={jobTitle ?? 'Learning Roadmap'}
				description={company ?? undefined}
				action={
					<div className="flex items-center gap-2">
						{!confirmDelete && data && (
							<StatusPicker current={currentStatus} planId={planId} />
						)}
						{confirmDelete ? (
							<>
								<span className="text-muted-foreground text-xs">
									Delete this roadmap?
								</span>
								<Button
									variant="destructive"
									size="sm"
									className="h-7 text-xs"
									onClick={handleDelete}
									disabled={isDeleting}
								>
									{isDeleting ? (
										<Loader2 className="size-3 animate-spin" />
									) : (
										'Confirm'
									)}
								</Button>
								<Button
									variant="ghost"
									size="sm"
									className="h-7 text-xs"
									onClick={() => setConfirmDelete(false)}
								>
									Cancel
								</Button>
							</>
						) : (
							<>
								<Button
									variant="ghost"
									size="sm"
									className="text-muted-foreground hover:text-destructive h-7 gap-1.5"
									onClick={() => setConfirmDelete(true)}
								>
									<Trash2 className="size-3.5" />
									<span className="hidden sm:inline">Delete</span>
								</Button>
								<Button
									variant="ghost"
									size="sm"
									className="text-muted-foreground hover:text-foreground gap-1.5"
									onClick={() => void navigate('/roadmaps')}
								>
									<ArrowLeft className="size-3.5" />
									<span className="hidden sm:inline">All roadmaps</span>
								</Button>
							</>
						)}
					</div>
				}
			/>

			<div className="p-6 md:p-8">
				<div>
					{/* Summary card */}
					<Card className="border-border/40 relative mb-8 overflow-hidden rounded-2xl border shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
						<div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(99,102,241,0.07),transparent_60%)]" />
						<CardContent className="relative p-5">
							<div className="mb-4 flex gap-3.5">
								<div className="bg-accent/[0.08] flex size-8 shrink-0 items-center justify-center rounded-xl">
									<Sparkles className="text-accent size-4" />
								</div>
								<p className="text-foreground/80 text-sm leading-relaxed">
									{roadmap.summary}
								</p>
							</div>
							<div className="border-border/30 flex flex-wrap gap-2 border-t pt-4">
								<div className="bg-muted/60 inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5">
									<Clock className="text-accent/60 size-3" />
									<span className="text-xs font-medium">
										~{roadmap.estimated_weeks} weeks
									</span>
								</div>
								<div className="bg-muted/60 inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5">
									<Layers className="text-accent/60 size-3" />
									<span className="text-xs font-medium">
										{topics.length} topics
									</span>
								</div>
								<div className="bg-muted/60 inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5">
									<BookOpen className="text-accent/60 size-3" />
									<span className="text-xs font-medium">
										{totalSubtopics} subtopics
									</span>
								</div>
							</div>
						</CardContent>
					</Card>

					{/* Topics timeline */}
					<div>
						{topics.map((topic, i) => (
							<TopicRow
								key={topic.title}
								topic={topic}
								defaultOpen={i === 0}
								isLast={i === topics.length - 1}
								planId={planId}
							/>
						))}
					</div>
				</div>
			</div>
		</Layout>
	);
}
