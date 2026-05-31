import { useState } from 'react';
import { ArrowRight, Building2, Clock, Plus, Search } from 'lucide-react';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

import CreateRoadMapModal from '../roadmaps/create-roadmap-modal';
import { TopBar } from './top-bar';

// --- Types — replace with API response shapes when ready ---

interface Roadmap {
	id: string;
	title: string;
	company: string;
	postedAt: string;
	progress: number;
	matchedSkills: number;
	totalSkills: number;
	status: 'active' | 'completed' | 'paused';
}

// --- Status config — dot + muted label, no coloured badges ---

const STATUS_CONFIG: Record<
	Roadmap['status'],
	{ label: string; dotClass: string }
> = {
	active: { label: 'Active', dotClass: 'bg-emerald-500' },
	completed: { label: 'Completed', dotClass: 'bg-accent' },
	paused: { label: 'Paused', dotClass: 'bg-muted-foreground/40' },
};

// --- Placeholder data — replace with API / query data ---

const roadmaps: Roadmap[] = [
	{
		id: '1',
		title: 'Senior Frontend Engineer',
		company: 'Stripe',
		postedAt: '2 days ago',
		progress: 60,
		matchedSkills: 12,
		totalSkills: 18,
		status: 'active',
	},
	{
		id: '2',
		title: 'Full Stack Developer',
		company: 'Linear',
		postedAt: '5 days ago',
		progress: 25,
		matchedSkills: 8,
		totalSkills: 22,
		status: 'active',
	},
	{
		id: '3',
		title: 'React Developer',
		company: 'Vercel',
		postedAt: '1 week ago',
		progress: 80,
		matchedSkills: 15,
		totalSkills: 16,
		status: 'active',
	},
	{
		id: '4',
		title: 'Frontend Engineer',
		company: 'Notion',
		postedAt: '2 weeks ago',
		progress: 100,
		matchedSkills: 14,
		totalSkills: 14,
		status: 'completed',
	},
	{
		id: '5',
		title: 'UI Engineer',
		company: 'Figma',
		postedAt: '3 weeks ago',
		progress: 40,
		matchedSkills: 9,
		totalSkills: 20,
		status: 'paused',
	},
];

export default function RoadmapsMain() {
	const [open, setOpen] = useState<boolean>(false);
	return (
		<>
			<TopBar
				title="Roadmaps"
				description="Paste a job listing to generate a personalised learning path."
				action={
					<Button size="sm" className="gap-1.5" onClick={() => setOpen(true)}>
						<Plus className="size-3.5" />
						New Roadmap
					</Button>
				}
			/>

			<div className="flex flex-col gap-8 p-6 md:p-8">
				{/* Search + filters */}
				<div className="flex items-center gap-3">
					<div className="relative flex-1">
						<Search className="text-muted-foreground absolute left-3 top-1/2 size-4 -translate-y-1/2" />
						<Input
							placeholder="Search roadmaps..."
							className="bg-background pl-9"
						/>
					</div>
					{/* Filter pills — wire up to state when ready */}
					<div className="flex gap-2">
						{(['active', 'completed', 'paused'] as const).map((s) => (
							<Button
								key={s}
								type="button"
								variant="outline"
								size="sm"
								className="gap-1.5 text-xs"
							>
								<span
									className={cn(
										'size-1.5 rounded-full',
										STATUS_CONFIG[s].dotClass,
									)}
								/>
								{STATUS_CONFIG[s].label}
							</Button>
						))}
					</div>
				</div>

				{/* Roadmaps grid */}
				<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
					{roadmaps.map((roadmap) => {
						const statusConfig = STATUS_CONFIG[roadmap.status];
						const gapToClose = roadmap.totalSkills - roadmap.matchedSkills;

						return (
							<Card
								key={roadmap.id}
								className="border-border/60 group flex flex-col rounded-xl border shadow-[0_1px_2px_rgba(0,0,0,0.03)] transition-all duration-150 hover:-translate-y-0.5 hover:shadow-[0_6px_18px_rgba(0,0,0,0.05)]"
							>
								<CardContent className="flex flex-1 flex-col gap-4 p-5">
									{/* Company + title */}
									<div className="flex items-start justify-between gap-2">
										<div className="min-w-0">
											<p className="text-muted-foreground text-xs">
												{roadmap.company}
											</p>
											<h3 className="mt-0.5 text-base font-medium leading-snug">
												{roadmap.title}
											</h3>
										</div>
										<Avatar className="size-9 shrink-0 rounded-xl">
											<AvatarFallback className="bg-muted text-muted-foreground rounded-xl text-xs font-medium">
												{roadmap.company[0]}
											</AvatarFallback>
										</Avatar>
									</div>

									{/* Meta row */}
									<div className="text-muted-foreground flex items-center gap-3 text-xs">
										<span className="flex items-center gap-1">
											<Building2 className="size-3" />
											{roadmap.company}
										</span>
										<span className="flex items-center gap-1">
											<Clock className="size-3" />
											{roadmap.postedAt}
										</span>
									</div>

									{/* Progress */}
									<div className="flex flex-col gap-1.5">
										<div className="flex justify-between text-xs">
											<span className="text-muted-foreground">Progress</span>
											<span className="font-medium">{roadmap.progress}%</span>
										</div>
										<div className="bg-muted h-2 w-full rounded-full">
											<div
												className="bg-accent h-2 rounded-full transition-all"
												style={{ width: `${roadmap.progress}%` }}
											/>
										</div>
									</div>

									{/* Footer */}
									<div className="mt-auto flex items-center justify-between">
										<div className="flex items-center gap-3">
											<span className="text-muted-foreground flex items-center gap-1.5 text-xs">
												<span
													className={cn(
														'size-1.5 rounded-full',
														statusConfig.dotClass,
													)}
												/>
												{statusConfig.label}
											</span>
											{gapToClose > 0 && (
												<span className="text-muted-foreground text-xs">
													{gapToClose} to learn
												</span>
											)}
										</div>
										<Button
											variant="ghost"
											size="sm"
											className="h-7 gap-1 px-2 text-xs"
										>
											{roadmap.status === 'completed' ? 'Review' : 'Continue'}
											<ArrowRight className="size-3" />
										</Button>
									</div>
								</CardContent>
							</Card>
						);
					})}
				</div>
			</div>
			<CreateRoadMapModal open={open} setOpen={setOpen} />
		</>
	);
}
