import { useState } from 'react';
import { useNavigate } from 'react-router';
import {
	Archive,
	ArrowRight,
	Building2,
	CheckCircle2,
	Clock,
	FileText,
	MoreHorizontal,
	Plus,
	RotateCcw,
	Sparkles,
	Trash2,
} from 'lucide-react';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import type { SavedRoadmap } from '@/network/roadmaps.service';
import { useGetUserProfile } from '@/query/profile.query';
import {
	useDeleteRoadmap,
	useGetRoadmaps,
	useUpdateRoadmapStatus,
} from '@/query/roadmaps.query';

import CreateRoadMapModal from '../roadmaps/create-roadmap-modal';
import { TopBar } from './top-bar';

// ---------------------------------------------------------------------------
// Status config
// ---------------------------------------------------------------------------

type RoadmapStatus = 'active' | 'completed' | 'archived';

const STATUS_CONFIG: Record<
	RoadmapStatus,
	{ label: string; dotClass: string }
> = {
	active: { label: 'Active', dotClass: 'bg-accent' },
	completed: { label: 'Completed', dotClass: 'bg-emerald-500' },
	archived: { label: 'Archived', dotClass: 'bg-muted-foreground/40' },
};

const STATUS_TRANSITIONS: Record<
	RoadmapStatus,
	{ status: RoadmapStatus; label: string; icon: React.ElementType }[]
> = {
	active: [
		{ status: 'completed', label: 'Mark completed', icon: CheckCircle2 },
		{ status: 'archived', label: 'Archive', icon: Archive },
	],
	completed: [
		{ status: 'active', label: 'Mark active', icon: RotateCcw },
		{ status: 'archived', label: 'Archive', icon: Archive },
	],
	archived: [{ status: 'active', label: 'Restore', icon: RotateCcw }],
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatRelativeDate(dateStr: string): string {
	const diff = Date.now() - new Date(dateStr).getTime();
	const days = Math.floor(diff / (1000 * 60 * 60 * 24));
	if (days === 0) return 'Today';
	if (days === 1) return 'Yesterday';
	if (days < 7) return `${days} days ago`;
	if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
	return `${Math.floor(days / 30)} months ago`;
}

// ---------------------------------------------------------------------------
// Empty / no-CV states
// ---------------------------------------------------------------------------

function NoCvState() {
	const navigate = useNavigate();
	return (
		<div className="flex flex-col items-center justify-center py-24 text-center">
			<div className="bg-accent/[0.08] mb-4 flex size-14 items-center justify-center rounded-2xl">
				<FileText className="text-accent size-6" />
			</div>
			<h3 className="text-base font-medium">Upload your CV first</h3>
			<p className="text-muted-foreground mt-1 max-w-xs text-sm">
				Roadmaps are personalised to your skill profile. Upload your CV so we
				can understand where you are today.
			</p>
			<Button
				size="sm"
				className="mt-6 gap-1.5"
				onClick={() => void navigate('/skills')}
			>
				<FileText className="size-3.5" />
				Upload CV
			</Button>
		</div>
	);
}

function EmptyState({ onNew }: { onNew: () => void }) {
	return (
		<div className="flex flex-col items-center justify-center py-24 text-center">
			<div className="bg-accent/[0.08] mb-4 flex size-14 items-center justify-center rounded-2xl">
				<Sparkles className="text-accent size-6" />
			</div>
			<h3 className="text-base font-medium">No roadmaps yet</h3>
			<p className="text-muted-foreground mt-1 max-w-xs text-sm">
				Paste a job listing to generate a personalised learning path based on
				your current skills.
			</p>
			<Button size="sm" className="mt-6 gap-1.5" onClick={onNew}>
				<Plus className="size-3.5" />
				New Roadmap
			</Button>
		</div>
	);
}

// ---------------------------------------------------------------------------
// Roadmap card — extracted so it can call hooks per-instance
// ---------------------------------------------------------------------------

function RoadmapCard({ roadmap }: { roadmap: SavedRoadmap }) {
	const navigate = useNavigate();
	const { mutate: updateStatus } = useUpdateRoadmapStatus(roadmap.id);
	const { mutate: deleteRoadmap } = useDeleteRoadmap();

	const status = roadmap.status as RoadmapStatus;
	const statusConfig = STATUS_CONFIG[status];
	const transitions = STATUS_TRANSITIONS[status];

	return (
		<Card
			className="border-border/60 group flex cursor-pointer flex-col rounded-xl border shadow-[0_1px_2px_rgba(0,0,0,0.03)] transition-all duration-150 hover:-translate-y-0.5 hover:shadow-[0_6px_18px_rgba(0,0,0,0.05)]"
			onClick={() => void navigate(`/roadmaps/view/${roadmap.id}`)}
		>
			<CardContent className="flex flex-1 flex-col gap-4 p-5">
				{/* Company + title */}
				<div className="flex items-start justify-between gap-2">
					<div className="min-w-0">
						{roadmap.company && (
							<p className="text-muted-foreground text-xs">{roadmap.company}</p>
						)}
						<h3 className="mt-0.5 text-base font-medium leading-snug">
							{roadmap.job_title ?? 'Untitled Roadmap'}
						</h3>
					</div>
					<Avatar className="size-9 shrink-0 rounded-xl">
						<AvatarFallback className="bg-muted text-muted-foreground rounded-xl text-xs font-medium">
							{(roadmap.company ?? roadmap.job_title ?? '?')[0].toUpperCase()}
						</AvatarFallback>
					</Avatar>
				</div>

				{/* Meta */}
				<div className="text-muted-foreground flex items-center gap-3 text-xs">
					{roadmap.company && (
						<span className="flex items-center gap-1">
							<Building2 className="size-3" />
							{roadmap.company}
						</span>
					)}
					<span className="flex items-center gap-1">
						<Clock className="size-3" />
						{formatRelativeDate(roadmap.created_at)}
					</span>
					{roadmap.estimated_weeks && <span>~{roadmap.estimated_weeks}w</span>}
				</div>

				{/* Topics summary */}
				<div className="text-muted-foreground flex items-center gap-3 text-xs">
					<span>
						{roadmap.topic_count} topic{roadmap.topic_count !== 1 ? 's' : ''}
					</span>
					<span className="text-muted-foreground/30">·</span>
					<span>
						{roadmap.subtopic_count} learning item
						{roadmap.subtopic_count !== 1 ? 's' : ''}
					</span>
				</div>

				{/* Footer */}
				<div className="mt-auto flex items-center justify-between">
					<span className="text-muted-foreground flex items-center gap-1.5 text-xs">
						<span
							className={cn('size-1.5 rounded-full', statusConfig.dotClass)}
						/>
						{statusConfig.label}
					</span>

					<div className="flex items-center gap-1">
						<Button
							variant="ghost"
							size="sm"
							className="h-7 gap-1 px-2 text-xs"
							onClick={(e) => {
								e.stopPropagation();
								void navigate(`/roadmaps/view/${roadmap.id}`);
							}}
						>
							View
							<ArrowRight className="size-3" />
						</Button>

						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button
									variant="ghost"
									size="sm"
									className="h-7 w-7 p-0"
									onClick={(e) => e.stopPropagation()}
								>
									<MoreHorizontal className="size-3.5" />
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end">
								{transitions.map(({ status: next, label, icon: Icon }) => (
									<DropdownMenuItem
										key={next}
										className="gap-2"
										onClick={(e) => {
											e.stopPropagation();
											updateStatus(next);
										}}
									>
										<Icon className="size-3.5" />
										{label}
									</DropdownMenuItem>
								))}
								<DropdownMenuSeparator />
								<DropdownMenuItem
									className="text-destructive focus:text-destructive gap-2"
									onClick={(e) => {
										e.stopPropagation();
										deleteRoadmap(roadmap.id);
									}}
								>
									<Trash2 className="size-3.5" />
									Delete
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function RoadmapsMain() {
	const [open, setOpen] = useState(false);
	const { data: roadmaps, isLoading } = useGetRoadmaps();
	const { data: profile, isLoading: profileLoading } = useGetUserProfile();

	const hasCV = !!profile?.cv;
	const ready = !profileLoading;

	return (
		<>
			<TopBar
				title="Roadmaps"
				description="Paste a job listing to generate a personalised learning path."
				action={
					hasCV ? (
						<Button size="sm" className="gap-1.5" onClick={() => setOpen(true)}>
							<Plus className="size-3.5" />
							New Roadmap
						</Button>
					) : null
				}
			/>

			<div className="p-6 md:p-8">
				{(!ready || isLoading) && (
					<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
						{Array.from({ length: 3 }).map((_, i) => (
							<Card
								key={i}
								className="border-border/60 h-48 animate-pulse rounded-xl border"
							/>
						))}
					</div>
				)}

				{ready && !isLoading && !hasCV && <NoCvState />}

				{ready &&
					!isLoading &&
					hasCV &&
					(!roadmaps || roadmaps.length === 0) && (
						<EmptyState onNew={() => setOpen(true)} />
					)}

				{ready && !isLoading && hasCV && roadmaps && roadmaps.length > 0 && (
					<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
						{roadmaps.map((roadmap) => (
							<RoadmapCard key={roadmap.id} roadmap={roadmap} />
						))}
					</div>
				)}
			</div>

			<CreateRoadMapModal open={open} setOpen={setOpen} />
		</>
	);
}
