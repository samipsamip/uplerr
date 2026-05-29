import { CheckCircle2, Database, Sparkles } from 'lucide-react';
import type { ResumeStructuredData } from '@uppler/types';

import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import type { SkillMatchMeta } from '@/network/profile.service';

import {
	categorizeSkills,
	computeProfileStrength,
	detectProfileType,
	strengthLabel,
} from './utils';

interface AiSidebarProps {
	data: ResumeStructuredData;
	skillMatchMeta?: SkillMatchMeta;
}

export function AiSidebar({ data, skillMatchMeta }: AiSidebarProps) {
	const strength = computeProfileStrength(data);
	const label = strengthLabel(strength);
	const profileType = detectProfileType(data.skills);
	const categories = categorizeSkills(data.skills);
	const totalSkills = data.skills.length;
	const maxCategoryCount = Math.max(...categories.map(([, s]) => s.length), 1);

	const goodRoles = data.experience.filter(
		(e) =>
			e.role && e.company && e.duration && (e.description?.length ?? 0) > 100,
	).length;

	const completenessFactors = [
		{ label: 'Identity', complete: !!(data.name && data.location) },
		{ label: 'Contact', complete: !!(data.email && data.phone) },
		{
			label: 'Online presence',
			complete: !!(data.links?.linkedin || data.links?.github),
		},
		{ label: 'Work experience', complete: data.experience.length > 0 },
		{
			label: `Skills${data.skills.length > 0 ? ` · ${data.skills.length}` : ''}`,
			complete: data.skills.length >= 8,
		},
		{ label: 'Education', complete: data.education.length > 0 },
		{ label: 'Projects', complete: (data.projects?.length ?? 0) > 0 },
	];

	const badgeClass = cn(
		'text-[11px] font-medium',
		label === 'Excellent' &&
			'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-0',
		label === 'Strong' && 'bg-accent/10 text-accent border-0',
		label === 'Good' && 'bg-muted text-muted-foreground border-0',
		label === 'Building' &&
			'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-0',
	);

	return (
		<aside className="border-border/40 flex w-full flex-col gap-0 overflow-auto border-l">
			<div className="flex flex-col gap-7 px-6 py-8">
				{/* Profile Strength */}
				<div className="flex flex-col gap-4">
					<p className="text-muted-foreground/50 text-[10px] font-semibold uppercase tracking-[0.1em]">
						Profile Strength
					</p>
					<div className="flex items-end justify-between">
						<p className="text-4xl font-semibold tracking-tight">{strength}%</p>
						<Badge className={badgeClass}>{label}</Badge>
					</div>
					<div className="bg-muted h-1.5 rounded-full">
						<div
							className="bg-accent h-1.5 rounded-full transition-all duration-700"
							style={{ width: `${strength}%` }}
						/>
					</div>
					<div className="flex flex-col gap-2.5">
						{completenessFactors.map(({ label: factorLabel, complete }) => (
							<div key={factorLabel} className="flex items-center gap-2">
								<div
									className={cn(
										'size-1.5 shrink-0 rounded-full',
										complete ? 'bg-accent/70' : 'bg-muted-foreground/20',
									)}
								/>
								<span
									className={cn(
										'text-xs',
										complete
											? 'text-foreground/70'
											: 'text-muted-foreground/40',
									)}
								>
									{factorLabel}
								</span>
							</div>
						))}
					</div>
				</div>

				<Separator className="bg-border/40" />

				{/* AI Analysis */}
				<div className="flex flex-col gap-3">
					<p className="text-muted-foreground/50 text-[10px] font-semibold uppercase tracking-[0.1em]">
						AI Analysis
					</p>
					<div className="flex items-start gap-2">
						<Sparkles className="text-accent mt-0.5 size-3.5 shrink-0" />
						<p className="text-muted-foreground text-sm leading-relaxed">
							{profileType}
						</p>
					</div>
					{data.experience.length > 0 && (
						<div className="flex items-start gap-2">
							<CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-emerald-500/70" />
							<p className="text-muted-foreground text-sm">
								{goodRoles === data.experience.length
									? `All ${data.experience.length} roles extracted cleanly`
									: `${goodRoles} of ${data.experience.length} roles look good`}
							</p>
						</div>
					)}
					{skillMatchMeta && skillMatchMeta.total > 0 && (
						<div className="flex items-start gap-2">
							<Database className="text-accent/70 mt-0.5 size-3.5 shrink-0" />
							<p className="text-muted-foreground text-sm">
								<span className="text-foreground/80 font-medium">
									{skillMatchMeta.matched}
								</span>
								{' of '}
								<span className="text-foreground/80 font-medium">
									{skillMatchMeta.total}
								</span>
								{' skills recognized in our catalog'}
							</p>
						</div>
					)}
				</div>

				{categories.length > 0 && (
					<>
						<Separator className="bg-border/40" />

						{/* Skill Distribution */}
						<div className="flex flex-col gap-3">
							<div className="flex items-baseline justify-between">
								<p className="text-muted-foreground/50 text-[10px] font-semibold uppercase tracking-[0.1em]">
									Skill Distribution
								</p>
								<span className="text-muted-foreground/40 text-[10px]">
									{totalSkills} total
								</span>
							</div>
							{categories.map(([category, categorySkills]) => (
								<div key={category} className="flex items-center gap-3">
									<span className="text-muted-foreground/70 w-20 shrink-0 text-xs">
										{category}
									</span>
									<div className="bg-muted h-1 flex-1 rounded-full">
										<div
											className="bg-accent/50 h-1 rounded-full transition-all duration-500"
											style={{
												width: `${(categorySkills.length / maxCategoryCount) * 100}%`,
											}}
										/>
									</div>
									<span className="text-foreground/60 w-4 shrink-0 text-right text-xs font-medium">
										{categorySkills.length}
									</span>
								</div>
							))}
						</div>
					</>
				)}
			</div>
		</aside>
	);
}
