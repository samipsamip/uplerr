import { ArrowRight, Check, Plus, Route, TrendingUp, Zap } from 'lucide-react';
import { NavLink } from 'react-router';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { TopBar } from './top-bar';

// --- Types — replace with API response shapes when ready ---

interface Stat {
	label: string;
	value: string;
	sub: string;
	icon: React.ElementType;
}

interface OnboardingStep {
	label: string;
	description: string;
	done: boolean;
}

interface Roadmap {
	id: string;
	title: string;
	company: string;
	progress: number;
	matchedSkills: number;
	totalSkills: number;
}

// --- Placeholder data — swap for real query data ---

const stats: Stat[] = [
	{
		label: 'Active Roadmaps',
		value: '3',
		sub: '+1 this week',
		icon: Route,
	},
	{
		label: 'Avg. Progress',
		value: '42%',
		sub: 'Across all roadmaps',
		icon: TrendingUp,
	},
	{
		label: 'Skills Gap',
		value: '8 skills',
		sub: 'To your next role',
		icon: Zap,
	},
];

const onboardingSteps: OnboardingStep[] = [
	{
		label: 'Upload your CV',
		description: 'We extract your current skills automatically',
		done: true,
	},
	{
		label: 'Paste a job listing',
		description: 'Drop in a URL or paste the description directly',
		done: false,
	},
	{
		label: 'Generate your roadmap',
		description: 'Get a personalised learning path in seconds',
		done: false,
	},
];

const roadmaps: Roadmap[] = [
	{
		id: '1',
		title: 'Senior Frontend Engineer',
		company: 'Stripe',
		progress: 60,
		matchedSkills: 12,
		totalSkills: 18,
	},
	{
		id: '2',
		title: 'Full Stack Developer',
		company: 'Linear',
		progress: 25,
		matchedSkills: 8,
		totalSkills: 22,
	},
	{
		id: '3',
		title: 'React Developer',
		company: 'Vercel',
		progress: 80,
		matchedSkills: 15,
		totalSkills: 16,
	},
];

// ---

const completedSteps = onboardingSteps.filter((s) => s.done).length;
const onboardingComplete = completedSteps === onboardingSteps.length;

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

export default function DashboardMain() {
	return (
		<>
			<TopBar
				title={`${getGreeting()}, Samip`}
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
				<div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
					{stats.map((stat) => (
						<Card
							key={stat.label}
							className="rounded-xl border border-border/60 shadow-[0_1px_2px_rgba(0,0,0,0.03)]"
						>
							<CardContent className="flex items-start justify-between gap-3 p-5">
								<div className="flex flex-col gap-1">
									<p className="text-xs text-muted-foreground">{stat.label}</p>
									<p className="text-3xl font-semibold tracking-tight">
										{stat.value}
									</p>
									<p className="mt-0.5 text-xs text-muted-foreground">
										{stat.sub}
									</p>
								</div>
								<div className="shrink-0 rounded-xl bg-accent/[0.08] p-2.5">
									<stat.icon className="size-5 text-accent" />
								</div>
							</CardContent>
						</Card>
					))}
				</div>

				{/* Onboarding — hidden once all steps are complete */}
				{!onboardingComplete && (
					<div className="overflow-hidden rounded-2xl border border-border/50 bg-card shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
						{/* Accent progress strip — flush with top edge */}
						<div className="h-1 w-full bg-muted">
							<div
								className="h-full bg-accent transition-all"
								style={{
									width: `${(completedSteps / onboardingSteps.length) * 100}%`,
								}}
							/>
						</div>
						<div className="flex flex-col gap-5 px-6 py-6">
							<div className="flex items-start justify-between gap-4">
								<div>
									<p className="font-semibold">Get started with Uplerr</p>
									<p className="mt-0.5 text-sm text-muted-foreground">
										Complete these steps to generate your first roadmap.
									</p>
								</div>
								<span className="shrink-0 rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
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
														: 'border-2 border-muted-foreground/25 text-muted-foreground',
												)}
											>
												{step.done ? <Check className="size-3.5" /> : i + 1}
											</div>
											{i < onboardingSteps.length - 1 && (
												<div className="my-1 w-px flex-1 bg-border" />
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
											<p className="text-xs text-muted-foreground">
												{step.description}
											</p>
										</div>
									</div>
								))}
							</div>

							<Button size="sm" asChild className="self-start gap-1.5">
								<NavLink to="/roadmaps">
									<Plus className="size-3.5" />
									Paste your first job listing
								</NavLink>
							</Button>
						</div>
					</div>
				)}

				{/* Active roadmaps */}
				<div className="flex flex-col gap-4">
					<div className="flex items-center justify-between">
						<h2 className="text-xl font-semibold tracking-tight">
							Active Roadmaps
						</h2>
						<Button variant="ghost" size="sm" asChild className="gap-1 text-xs">
							<NavLink to="/roadmaps">
								View all
								<ArrowRight className="size-3.5" />
							</NavLink>
						</Button>
					</div>

					<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
						{roadmaps.map((roadmap) => {
							const gapToClose = roadmap.totalSkills - roadmap.matchedSkills;
							return (
								<Card
									key={roadmap.id}
									className="group flex flex-col rounded-xl border border-border/60 shadow-[0_1px_2px_rgba(0,0,0,0.03)] transition-all duration-150 hover:-translate-y-0.5 hover:shadow-[0_6px_18px_rgba(0,0,0,0.05)]"
								>
									<CardContent className="flex flex-1 flex-col gap-4 p-5">
										<div className="flex items-start justify-between gap-2">
											<div className="min-w-0">
												<p className="text-xs text-muted-foreground">
													{roadmap.company}
												</p>
												<h3 className="mt-0.5 text-base font-medium leading-snug">
													{roadmap.title}
												</h3>
											</div>
											<Avatar className="size-9 shrink-0 rounded-xl">
												<AvatarFallback className="rounded-xl bg-muted text-xs font-medium text-muted-foreground">
													{roadmap.company[0]}
												</AvatarFallback>
											</Avatar>
										</div>

										<div className="flex flex-col gap-1.5">
											<div className="flex justify-between text-xs">
												<span className="text-muted-foreground">Progress</span>
												<span className="font-medium">{roadmap.progress}%</span>
											</div>
											<div className="h-2 w-full rounded-full bg-muted">
												<div
													className="h-2 rounded-full bg-accent transition-all"
													style={{ width: `${roadmap.progress}%` }}
												/>
											</div>
										</div>

										<div className="mt-auto flex items-center justify-between">
											<span className="text-xs text-muted-foreground">
												{gapToClose > 0
													? `${gapToClose} skills to learn`
													: 'All matched'}
											</span>
											<Button
												variant="ghost"
												size="sm"
												className="h-7 gap-1 px-2 text-xs"
											>
												Continue
												<ArrowRight className="size-3" />
											</Button>
										</div>
									</CardContent>
								</Card>
							);
						})}
					</div>
				</div>
			</div>
		</>
	);
}
