import { NavLink, useNavigate } from 'react-router';
import {
	ArrowRight,
	BookOpen,
	Check,
	CheckCircle2,
	Plus,
	Route,
	Zap,
} from 'lucide-react';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import useAuthUser from '@/hooks/use-auth-user';
import { cn } from '@/lib/utils';
import { useGetUserProfile } from '@/query/profile.query';
import { useGetRoadmaps } from '@/query/roadmaps.query';
import { useGetUserSkills } from '@/query/user-skills.query';

import { TopBar } from './top-bar';

function getGreeting() {
	const h = new Date().getHours();
	if (h < 12) return 'Good morning';
	if (h < 18) return 'Good afternoon';
	return 'Good evening';
}

function getDateString() {
	return new Date().toLocaleDateString('en-US', {
		weekday: 'long',
		month: 'long',
		day: 'numeric',
	});
}

function getFirstName(fullName: string) {
	return fullName.split(' ')[0];
}

export default function DashboardMain() {
	const { name } = useAuthUser();
	const navigate = useNavigate();

	const { data: profile } = useGetUserProfile();
	const { data: skills } = useGetUserSkills();
	const { data: roadmaps } = useGetRoadmaps();

	const hasSkills = (skills?.length ?? 0) > 0;
	const hasRoadmap = (roadmaps?.length ?? 0) > 0;
	const hasCv = !!profile?.cv?.hasStructuredData;

	const activeRoadmaps = roadmaps?.filter((r) => r.status === 'active') ?? [];
	const completedRoadmaps =
		roadmaps?.filter((r) => r.status === 'completed') ?? [];
	const totalGaps = activeRoadmaps.reduce(
		(sum, r) => sum + r.subtopic_count,
		0,
	);

	const stats = [
		{
			label: 'Active Roadmaps',
			value: activeRoadmaps.length > 0 ? String(activeRoadmaps.length) : '—',
			sub:
				activeRoadmaps.length === 0
					? 'None yet'
					: `${activeRoadmaps.length} in progress`,
			icon: Route,
		},
		{
			label: 'Completed',
			value:
				completedRoadmaps.length > 0 ? String(completedRoadmaps.length) : '—',
			sub:
				completedRoadmaps.length === 0
					? 'None yet'
					: `${completedRoadmaps.length} finished`,
			icon: CheckCircle2,
		},
		{
			label: 'Skills in Profile',
			value: (skills?.length ?? 0) > 0 ? String(skills!.length) : '—',
			sub: (skills?.length ?? 0) === 0 ? 'Upload your CV' : 'From your CV',
			icon: BookOpen,
		},
		{
			label: 'Skills to Develop',
			value: totalGaps > 0 ? String(totalGaps) : hasSkills ? '0' : '—',
			sub:
				totalGaps > 0 ? 'Across active roadmaps' : 'Generate a roadmap first',
			icon: Zap,
		},
	];

	const onboardingSteps = [
		{
			label: hasCv ? 'CV uploaded' : 'Upload your CV',
			description: hasCv
				? 'Skills extracted from your CV'
				: hasSkills
					? 'Skills added manually'
					: 'We extract your current skills automatically',
			done: hasSkills || hasCv,
			href: '/skills',
		},
		{
			label: hasRoadmap ? 'Job listing analysed' : 'Paste a job listing',
			description: hasRoadmap
				? 'Skills gap identified'
				: 'Drop in a URL or paste the description directly',
			done: hasRoadmap,
			href: '/roadmaps',
		},
		{
			label: hasRoadmap ? 'Roadmap generated' : 'Generate your roadmap',
			description: hasRoadmap
				? 'Your personalised learning path is ready'
				: 'Get a personalised learning path in seconds',
			done: hasRoadmap,
			href: '/roadmaps',
		},
	];

	const completedSteps = onboardingSteps.filter((s) => s.done).length;
	const onboardingComplete = completedSteps === onboardingSteps.length;
	const nextStep = onboardingSteps.find((s) => !s.done);

	return (
		<>
			<TopBar
				title={`${getGreeting()}, ${getFirstName(name ?? 'there')}`}
				description={getDateString()}
				action={
					<Button size="sm" asChild className="gap-1.5">
						<NavLink to="/roadmaps">
							<Plus className="size-3.5" />
							New Roadmap
						</NavLink>
					</Button>
				}
			/>

			<div className="flex flex-col gap-8 p-6 md:p-8">
				{/* Stat cards */}
				<div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
					{stats.map((stat) => (
						<Card
							key={stat.label}
							className="border-border/60 rounded-xl border shadow-[0_1px_2px_rgba(0,0,0,0.03)]"
						>
							<CardContent className="flex items-start justify-between gap-3 p-5">
								<div className="flex flex-col gap-1">
									<p className="text-muted-foreground text-xs">{stat.label}</p>
									<p className="text-3xl font-semibold tracking-tight">
										{stat.value}
									</p>
									<p className="text-muted-foreground mt-0.5 text-xs">
										{stat.sub}
									</p>
								</div>
								<div className="bg-accent/[0.08] shrink-0 rounded-xl p-2.5">
									<stat.icon className="text-accent size-5" />
								</div>
							</CardContent>
						</Card>
					))}
				</div>

				{/* Onboarding checklist — hidden once complete */}
				{!onboardingComplete && (
					<div className="border-border/50 bg-card overflow-hidden rounded-2xl border shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
						<div className="bg-muted h-1 w-full">
							<div
								className="bg-accent h-full transition-all duration-500"
								style={{
									width: `${(completedSteps / onboardingSteps.length) * 100}%`,
								}}
							/>
						</div>
						<div className="flex flex-col gap-5 px-6 py-6">
							<div className="flex items-start justify-between gap-4">
								<div>
									<p className="font-semibold">Get started with Uplerr</p>
									<p className="text-muted-foreground mt-0.5 text-sm">
										Complete these steps to generate your first roadmap.
									</p>
								</div>
								<span className="bg-muted text-muted-foreground shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium">
									{completedSteps} / {onboardingSteps.length}
								</span>
							</div>

							<div>
								{onboardingSteps.map((step, i) => (
									<div key={step.label} className="flex gap-3">
										<div className="flex flex-col items-center">
											<div
												className={cn(
													'flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold',
													step.done
														? 'bg-accent text-white'
														: 'border-muted-foreground/25 text-muted-foreground border-2',
												)}
											>
												{step.done ? <Check className="size-3.5" /> : i + 1}
											</div>
											{i < onboardingSteps.length - 1 && (
												<div className="bg-border my-1 w-px flex-1" />
											)}
										</div>
										<div
											className={cn(
												'min-w-0',
												i < onboardingSteps.length - 1 && 'pb-4',
											)}
										>
											<p
												className={cn(
													'text-sm font-medium',
													step.done && 'text-muted-foreground line-through',
												)}
											>
												{step.label}
											</p>
											<p className="text-muted-foreground text-xs">
												{step.description}
											</p>
										</div>
									</div>
								))}
							</div>

							{nextStep && (
								<Button size="sm" asChild className="gap-1.5 self-start">
									<NavLink to={nextStep.href}>
										<Plus className="size-3.5" />
										{nextStep.label}
									</NavLink>
								</Button>
							)}
						</div>
					</div>
				)}

				{/* Skill profile */}
				{(skills?.length ?? 0) > 0 && (
					<div className="flex flex-col gap-4">
						<div className="flex items-center justify-between">
							<h2 className="text-xl font-semibold tracking-tight">
								Your Skills
							</h2>
							<Button
								variant="ghost"
								size="sm"
								asChild
								className="gap-1 text-xs"
							>
								<NavLink to="/skills">
									Manage
									<ArrowRight className="size-3.5" />
								</NavLink>
							</Button>
						</div>
						<div className="flex flex-wrap gap-2">
							{skills!.slice(0, 12).map((skill) => (
								<Badge
									key={skill.id}
									variant="secondary"
									className="rounded-lg px-2.5 py-1 text-sm font-normal"
								>
									{skill.name}
									<span className="text-muted-foreground ml-1.5 text-xs capitalize">
										{skill.level}
									</span>
								</Badge>
							))}
							{skills!.length > 12 && (
								<Badge
									variant="outline"
									className="text-muted-foreground rounded-lg px-2.5 py-1 text-sm font-normal"
								>
									+{skills!.length - 12} more
								</Badge>
							)}
						</div>
					</div>
				)}

				{/* Active roadmaps */}
				{activeRoadmaps.length > 0 && (
					<div className="flex flex-col gap-4">
						<div className="flex items-center justify-between">
							<h2 className="text-xl font-semibold tracking-tight">
								Active Roadmaps
							</h2>
							<Button
								variant="ghost"
								size="sm"
								asChild
								className="gap-1 text-xs"
							>
								<NavLink to="/roadmaps">
									View all
									<ArrowRight className="size-3.5" />
								</NavLink>
							</Button>
						</div>

						<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
							{activeRoadmaps.slice(0, 3).map((roadmap) => {
								return (
									<Card
										key={roadmap.id}
										className="border-border/60 group flex cursor-pointer flex-col rounded-xl border shadow-[0_1px_2px_rgba(0,0,0,0.03)] transition-all duration-150 hover:-translate-y-0.5 hover:shadow-[0_6px_18px_rgba(0,0,0,0.05)]"
										onClick={() =>
											void navigate(`/roadmaps/view/${roadmap.id}`)
										}
									>
										<CardContent className="flex flex-1 flex-col gap-4 p-5">
											<div className="flex items-start justify-between gap-2">
												<div className="min-w-0">
													{roadmap.company && (
														<p className="text-muted-foreground text-xs">
															{roadmap.company}
														</p>
													)}
													<h3 className="mt-0.5 text-base font-medium leading-snug">
														{roadmap.job_title ?? 'Untitled Roadmap'}
													</h3>
												</div>
												<Avatar className="size-9 shrink-0 rounded-xl">
													<AvatarFallback className="bg-muted text-muted-foreground rounded-xl text-xs font-medium">
														{(roadmap.company ??
															roadmap.job_title ??
															'?')[0].toUpperCase()}
													</AvatarFallback>
												</Avatar>
											</div>

											<div className="text-muted-foreground flex items-center gap-3 text-xs">
												<span>
													{roadmap.topic_count} topic
													{roadmap.topic_count !== 1 ? 's' : ''}
												</span>
												<span className="text-muted-foreground/30">·</span>
												<span>
													{roadmap.subtopic_count} learning item
													{roadmap.subtopic_count !== 1 ? 's' : ''}
												</span>
											</div>

											<div className="mt-auto flex items-center justify-between">
												<span className="text-muted-foreground text-xs">
													{roadmap.estimated_weeks
														? `~${roadmap.estimated_weeks}w`
														: ''}
												</span>
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
											</div>
										</CardContent>
									</Card>
								);
							})}
						</div>
					</div>
				)}
			</div>
		</>
	);
}
