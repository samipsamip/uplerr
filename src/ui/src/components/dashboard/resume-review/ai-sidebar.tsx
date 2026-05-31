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
import type { CvStructuredData, ResumeExtractionType } from '@uppler/types';

import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import type { SkillMatchMeta } from '@/network/profile.service';

import {
	categorizeSkills,
	computeProfileStrength,
	detectProfileType,
	estimateYearsOfExperience,
	flattenSkills,
	strengthLabel,
} from './utils';

interface AiSidebarProps {
	data: CvStructuredData;
	skillMatchMeta?: SkillMatchMeta;
}

function detectEducationLevel(
	education: ResumeExtractionType['education'],
): string | null {
	const text = education.map((e) => e.degree?.toLowerCase() ?? '').join(' ');
	if (/phd|doctorate|doctor of/.test(text)) return 'PhD';
	if (/master|msc|mba|m\.s\.|m\.eng/.test(text)) return "Master's";
	if (/bachelor|bsc|b\.s\.|b\.eng|b\.tech/.test(text)) return "Bachelor's";
	if (/diploma|certificate|cert\./.test(text)) return 'Diploma / Certificate';
	return null;
}

function detectCareerProgression(
	workHistory: ResumeExtractionType['work_history'],
): string | null {
	const roles = workHistory.map((e) => e.role?.toLowerCase() ?? '');
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

function getCompletionTips(data: CvStructuredData): string[] {
	const tips: string[] = [];
	const { extraction, skills } = data;
	const cd = extraction.contact_details;
	const allSkills = flattenSkills(skills);

	if (!cd.linkedin)
		tips.push('Add your LinkedIn to boost recruiter visibility');
	if (!cd.vcs_url && allSkills.length > 3)
		tips.push('Add a VCS profile link to show your work');
	if (!cd.portfolio) tips.push('A portfolio URL lifts your profile score');
	if (allSkills.length < 8)
		tips.push(
			`Add ${8 - allSkills.length} more skills to unlock roadmap matching`,
		);
	if (extraction.work_history.some((e) => e.bullet_points.length < 2)) {
		tips.push('Expand short role descriptions for better AI matching');
	}
	return tips.slice(0, 3);
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

/** Shared label style used in every card */
function SectionLabel({ children }: { children: React.ReactNode }) {
	return (
		<p className="text-muted-foreground text-[10px] font-semibold uppercase tracking-[0.1em]">
			{children}
		</p>
	);
}

/** Card wrapper: border + rounded on mobile, invisible on desktop */
function Card({
	className,
	children,
}: {
	className?: string;
	children: React.ReactNode;
}) {
	return (
		<div
			className={cn(
				'border-border/40 flex flex-col gap-3 rounded-xl border p-3',
				'md:gap-4 md:rounded-none md:border-0 md:p-0',
				className,
			)}
		>
			{children}
		</div>
	);
}

export function AiSidebar({ data, skillMatchMeta }: AiSidebarProps) {
	const strength = computeProfileStrength(data);
	const label = strengthLabel(strength);
	const profileType = detectProfileType(data.skills);
	const allSkillNames = flattenSkills(data.skills);
	const categories = categorizeSkills(allSkillNames);
	const totalSkills = allSkillNames.length;
	const maxCategoryCount = Math.max(...categories.map(([, s]) => s.length), 1);

	const yearsExp = estimateYearsOfExperience(data.extraction.work_history);
	const educationLevel = detectEducationLevel(data.extraction.education);
	const careerProgression = detectCareerProgression(
		data.extraction.work_history,
	);
	const completionTips = getCompletionTips(data);
	const suggestedSkills = getSuggestedSkills(profileType, allSkillNames);

	const goodRoles = data.extraction.work_history.filter(
		(e) =>
			e.role && e.company && e.start_date.raw && e.bullet_points.length >= 2,
	).length;
	const totalRoles = data.extraction.work_history.length;

	const experienceText = data.extraction.work_history
		.flatMap((e) => e.bullet_points)
		.join(' ')
		.toLowerCase();
	const skillsEvidenced = allSkillNames.filter((s) =>
		experienceText.includes(s.toLowerCase()),
	).length;

	const cd = data.extraction.contact_details;

	const completenessFactors = [
		{
			label: 'Identity',
			complete: !!(data.extraction.full_name && cd.location),
		},
		{ label: 'Contact', complete: !!(cd.email && cd.phone) },
		{
			label: 'Online presence',
			complete: !!(cd.linkedin || cd.vcs_url),
		},
		{ label: 'Work experience', complete: totalRoles > 0 },
		{
			label: `Skills${totalSkills > 0 ? ` · ${totalSkills}` : ''}`,
			complete: totalSkills >= 8,
		},
		{ label: 'Education', complete: data.extraction.education.length > 0 },
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
		<aside className="relative w-full overflow-auto">
			<div className="from-accent/[0.05] pointer-events-none absolute inset-0 bg-gradient-to-b via-transparent to-transparent" />

			{/*
			  Mobile:  2-column grid of cards
			  Desktop: single vertical column (md:flex md:flex-col)
			*/}
			<div className="relative grid grid-cols-2 gap-3 p-4 md:flex md:flex-col md:gap-7 md:px-6 md:py-8">
				{/* ── Profile Strength ── */}
				<Card>
					<SectionLabel>Profile Strength</SectionLabel>
					<div className="flex items-end justify-between">
						<p className="text-3xl font-semibold tracking-tight md:text-4xl">
							{strength}%
						</p>
						<Badge className={badgeClass}>{label}</Badge>
					</div>
					<div className="bg-muted h-1.5 rounded-full">
						<div
							className="bg-accent h-1.5 rounded-full transition-all duration-700"
							style={{ width: `${strength}%` }}
						/>
					</div>
					<div className="flex flex-col gap-2">
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
				</Card>

				{/* Desktop separator */}
				<Separator className="bg-border/40 hidden md:block" />

				{/* ── AI Analysis ── */}
				<Card>
					<SectionLabel>AI Analysis</SectionLabel>
					<div className="flex items-start gap-2">
						<div className="bg-accent/[0.08] text-accent mt-0.5 shrink-0 rounded-lg p-1">
							<Sparkles className="size-3" />
						</div>
						<p className="text-muted-foreground text-xs leading-relaxed md:text-sm">
							{profileType}
						</p>
					</div>
					{yearsExp !== null && (
						<div className="flex items-start gap-2">
							<div className="bg-accent/[0.08] text-accent mt-0.5 shrink-0 rounded-lg p-1">
								<TrendingUp className="size-3" />
							</div>
							<p className="text-muted-foreground text-xs md:text-sm">
								<span className="text-foreground/80 font-medium">
									~{yearsExp} {yearsExp === 1 ? 'year' : 'years'}
								</span>
								{' of work experience'}
							</p>
						</div>
					)}
					{careerProgression && (
						<div className="flex items-start gap-2">
							<div className="mt-0.5 shrink-0 rounded-lg bg-emerald-500/10 p-1 text-emerald-600">
								<TrendingUp className="size-3" />
							</div>
							<p className="text-muted-foreground text-xs md:text-sm">
								{careerProgression}
							</p>
						</div>
					)}
					{educationLevel && (
						<div className="flex items-start gap-2">
							<div className="bg-accent/[0.08] text-accent mt-0.5 shrink-0 rounded-lg p-1">
								<GraduationCap className="size-3" />
							</div>
							<p className="text-muted-foreground text-xs md:text-sm">
								<span className="text-foreground/80 font-medium">
									{educationLevel}
								</span>
								{' detected'}
							</p>
						</div>
					)}
					{totalRoles > 0 && (
						<div className="flex items-start gap-2">
							<div className="mt-0.5 shrink-0 rounded-lg bg-emerald-500/10 p-1 text-emerald-600">
								<CheckCircle2 className="size-3" />
							</div>
							<p className="text-muted-foreground text-xs md:text-sm">
								{goodRoles === totalRoles
									? `All ${totalRoles} roles extracted cleanly`
									: `${goodRoles} of ${totalRoles} roles look good`}
							</p>
						</div>
					)}
					{skillMatchMeta && skillMatchMeta.total > 0 && (
						<div className="flex items-start gap-2">
							<div className="bg-accent/[0.08] text-accent mt-0.5 shrink-0 rounded-lg p-1">
								<Database className="size-3" />
							</div>
							<p className="text-muted-foreground text-xs md:text-sm">
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
					{totalRoles > 0 && totalSkills > 0 && (
						<div className="flex items-start gap-2">
							<div className="bg-accent/[0.08] text-accent mt-0.5 shrink-0 rounded-lg p-1">
								<Layers3 className="size-3" />
							</div>
							<p className="text-muted-foreground text-xs md:text-sm">
								<span className="text-foreground/80 font-medium">
									{skillsEvidenced} of {totalSkills}
								</span>
								{' skills backed by experience'}
							</p>
						</div>
					)}
					{suggestedSkills.length > 0 && (
						<div className="flex items-start gap-2">
							<div className="bg-accent/[0.08] text-accent mt-0.5 shrink-0 rounded-lg p-1">
								<Lightbulb className="size-3" />
							</div>
							<p className="text-muted-foreground text-xs md:text-sm">
								{'Consider adding: '}
								<span className="text-foreground/80 font-medium">
									{suggestedSkills.join(', ')}
								</span>
							</p>
						</div>
					)}
				</Card>

				{/* ── Suggestions — spans both cols on mobile ── */}
				{completionTips.length > 0 && (
					<>
						<Separator className="bg-border/40 col-span-2 hidden md:block" />
						<Card className="col-span-2">
							<SectionLabel>Suggestions</SectionLabel>
							{completionTips.map((tip) => (
								<div key={tip} className="flex items-start gap-2">
									<div className="mt-0.5 shrink-0 rounded-lg bg-amber-500/10 p-1 text-amber-600">
										<AlertCircle className="size-3" />
									</div>
									<p className="text-muted-foreground text-xs leading-relaxed">
										{tip}
									</p>
								</div>
							))}
						</Card>
					</>
				)}

				{/* ── Skill Distribution — spans both cols on mobile ── */}
				{categories.length > 0 && (
					<>
						<Separator className="bg-border/40 col-span-2 hidden md:block" />
						<Card className="col-span-2">
							<div className="flex items-baseline justify-between">
								<SectionLabel>Skill Distribution</SectionLabel>
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
									<span className="text-muted-foreground/50 w-4 text-right text-xs">
										{categorySkills.length}
									</span>
								</div>
							))}
						</Card>
					</>
				)}
			</div>
		</aside>
	);
}
