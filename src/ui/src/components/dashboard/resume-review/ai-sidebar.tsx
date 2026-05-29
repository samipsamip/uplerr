import {
	AlertCircle,
	CheckCircle2,
	Database,
	GraduationCap,
	Layers3,
	Lightbulb,
	Sparkles,
	TrendingUp,
} from 'lucide-react';
import type { ResumeStructuredData } from '@uppler/types';

import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import type { SkillMatchMeta } from '@/network/profile.service';

import {
	categorizeSkills,
	computeProfileStrength,
	detectProfileType,
	estimateYearsOfExperience,
	strengthLabel,
} from './utils';

interface AiSidebarProps {
	data: ResumeStructuredData;
	skillMatchMeta?: SkillMatchMeta;
}

function detectEducationLevel(
	education: ResumeStructuredData['education'],
): string | null {
	const text = education.map((e) => e.degree?.toLowerCase() ?? '').join(' ');
	if (/phd|doctorate|doctor of/.test(text)) return 'PhD';
	if (/master|msc|mba|m\.s\.|m\.eng/.test(text)) return "Master's";
	if (/bachelor|bsc|b\.s\.|b\.eng|b\.tech/.test(text)) return "Bachelor's";
	if (/diploma|certificate|cert\./.test(text)) return 'Diploma / Certificate';
	return null;
}

function detectCareerProgression(
	experience: ResumeStructuredData['experience'],
): string | null {
	const roles = experience.map((e) => e.role?.toLowerCase() ?? '');
	const hasSenior = roles.some((r) =>
		/senior|lead|principal|staff|head|director|vp|architect/.test(r),
	);
	const hasJunior = roles.some((r) =>
		/junior|graduate|intern|entry|associate/.test(r),
	);
	if (hasSenior && hasJunior)
		return 'Growth arc detected: junior to senior roles';
	if (hasSenior) return 'Senior-level roles in your history';
	return null;
}

function getCompletionTips(data: ResumeStructuredData): string[] {
	const tips: string[] = [];
	if (!data.links?.linkedin)
		tips.push('Add your LinkedIn to boost recruiter visibility');
	if (!data.links?.github && data.skills.length > 3)
		tips.push('Add a GitHub link to show your work');
	if (!data.links?.portfolio)
		tips.push('A portfolio URL lifts your profile score');
	if (data.skills.length < 8)
		tips.push(
			`Add ${8 - data.skills.length} more skills to unlock roadmap matching`,
		);
	if (
		data.experience.some((e) => !e.description || e.description.length < 80)
	) {
		tips.push('Expand short role descriptions for better AI matching');
	}
	if ((data.projects?.length ?? 0) === 0)
		tips.push('Add a project to demonstrate hands-on work');
	return tips.slice(0, 3); // show at most 3 tips
}

const SUGGESTIONS: Record<string, string[]> = {
	'Full-stack': ['TypeScript', 'Docker', 'PostgreSQL', 'Git', 'REST API'],
	Frontend: ['TypeScript', 'Git', 'Vite', 'Tailwind CSS'],
	Backend: ['Docker', 'PostgreSQL', 'Git', 'REST API'],
	Cloud: ['Terraform', 'Docker', 'Kubernetes', 'GitHub Actions'],
};

function getSuggestedSkills(
	profileType: string,
	existingSkills: string[],
): string[] {
	const lowerExisting = existingSkills.map((s) => s.toLowerCase());
	for (const [key, suggestions] of Object.entries(SUGGESTIONS)) {
		if (profileType.includes(key)) {
			return suggestions
				.filter((s) => !lowerExisting.includes(s.toLowerCase()))
				.slice(0, 2);
		}
	}
	return [];
}

export function AiSidebar({ data, skillMatchMeta }: AiSidebarProps) {
	const strength = computeProfileStrength(data);
	const label = strengthLabel(strength);
	const profileType = detectProfileType(data.skills);
	const categories = categorizeSkills(data.skills);
	const totalSkills = data.skills.length;
	const maxCategoryCount = Math.max(...categories.map(([, s]) => s.length), 1);

	const yearsExp = estimateYearsOfExperience(data.experience);
	const educationLevel = detectEducationLevel(data.education);
	const careerProgression = detectCareerProgression(data.experience);
	const completionTips = getCompletionTips(data);

	const experienceText = data.experience
		.map((e) => e.description ?? '')
		.join(' ')
		.toLowerCase();
	const skillsEvidenced = data.skills.filter((s) =>
		experienceText.includes(s.toLowerCase()),
	).length;

	const suggestedSkills = getSuggestedSkills(profileType, data.skills);

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
		<aside className="border-border/40 relative flex w-full flex-col gap-0 overflow-auto border-l">
			<div className="from-accent/[0.05] pointer-events-none absolute inset-0 bg-gradient-to-b via-transparent to-transparent" />
			<div className="relative flex flex-col gap-7 px-6 py-8">
				{/* Profile Strength */}
				<div className="flex flex-col gap-4">
					<p className="text-muted-foreground text-[10px] font-semibold uppercase tracking-[0.1em]">
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
					<p className="text-muted-foreground text-[10px] font-semibold uppercase tracking-[0.1em]">
						AI Analysis
					</p>
					<div className="flex items-start gap-2.5">
						<div className="bg-accent/[0.08] text-accent mt-0.5 shrink-0 rounded-lg p-1">
							<Sparkles className="size-3" />
						</div>
						<p className="text-muted-foreground text-sm leading-relaxed">
							{profileType}
						</p>
					</div>
					{yearsExp !== null && (
						<div className="flex items-start gap-2.5">
							<div className="bg-accent/[0.08] text-accent mt-0.5 shrink-0 rounded-lg p-1">
								<TrendingUp className="size-3" />
							</div>
							<p className="text-muted-foreground text-sm">
								<span className="text-foreground/80 font-medium">
									~{yearsExp} {yearsExp === 1 ? 'year' : 'years'}
								</span>
								{' of work experience'}
							</p>
						</div>
					)}
					{careerProgression && (
						<div className="flex items-start gap-2.5">
							<div className="mt-0.5 shrink-0 rounded-lg bg-emerald-500/10 p-1 text-emerald-600">
								<TrendingUp className="size-3" />
							</div>
							<p className="text-muted-foreground text-sm">
								{careerProgression}
							</p>
						</div>
					)}
					{educationLevel && (
						<div className="flex items-start gap-2.5">
							<div className="bg-accent/[0.08] text-accent mt-0.5 shrink-0 rounded-lg p-1">
								<GraduationCap className="size-3" />
							</div>
							<p className="text-muted-foreground text-sm">
								<span className="text-foreground/80 font-medium">
									{educationLevel}
								</span>
								{' detected'}
							</p>
						</div>
					)}
					{data.experience.length > 0 && (
						<div className="flex items-start gap-2.5">
							<div className="mt-0.5 shrink-0 rounded-lg bg-emerald-500/10 p-1 text-emerald-600">
								<CheckCircle2 className="size-3" />
							</div>
							<p className="text-muted-foreground text-sm">
								{goodRoles === data.experience.length
									? `All ${data.experience.length} roles extracted cleanly`
									: `${goodRoles} of ${data.experience.length} roles look good`}
							</p>
						</div>
					)}
					{skillMatchMeta && skillMatchMeta.total > 0 && (
						<div className="flex items-start gap-2.5">
							<div className="bg-accent/[0.08] text-accent mt-0.5 shrink-0 rounded-lg p-1">
								<Database className="size-3" />
							</div>
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
					{data.experience.length > 0 && data.skills.length > 0 && (
						<div className="flex items-start gap-2.5">
							<div className="bg-accent/[0.08] text-accent mt-0.5 shrink-0 rounded-lg p-1">
								<Layers3 className="size-3" />
							</div>
							<p className="text-muted-foreground text-sm">
								<span className="text-foreground/80 font-medium">
									{skillsEvidenced} of {data.skills.length}
								</span>
								{' skills backed by experience'}
							</p>
						</div>
					)}
					{suggestedSkills.length > 0 && (
						<div className="flex items-start gap-2.5">
							<div className="bg-accent/[0.08] text-accent mt-0.5 shrink-0 rounded-lg p-1">
								<Lightbulb className="size-3" />
							</div>
							<p className="text-muted-foreground text-sm">
								{'Consider adding: '}
								<span className="text-foreground/80 font-medium">
									{suggestedSkills.join(', ')}
								</span>
							</p>
						</div>
					)}
				</div>

				{completionTips.length > 0 && (
					<>
						<Separator className="bg-border/40" />
						<div className="flex flex-col gap-3">
							<p className="text-muted-foreground text-[10px] font-semibold uppercase tracking-[0.1em]">
								Suggestions
							</p>
							{completionTips.map((tip) => (
								<div key={tip} className="flex items-start gap-2.5">
									<div className="mt-0.5 shrink-0 rounded-lg bg-amber-500/10 p-1 text-amber-600">
										<AlertCircle className="size-3" />
									</div>
									<p className="text-muted-foreground text-xs leading-relaxed">
										{tip}
									</p>
								</div>
							))}
						</div>
					</>
				)}

				{categories.length > 0 && (
					<>
						<Separator className="bg-border/40" />

						{/* Skill Distribution */}
						<div className="flex flex-col gap-3">
							<div className="flex items-baseline justify-between">
								<p className="text-muted-foreground text-[10px] font-semibold uppercase tracking-[0.1em]">
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
