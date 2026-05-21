import { ArrowRight, FileText, Plus, ShieldCheck, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { TopBar } from './top-bar';

// --- Types — replace with API response shapes when ready ---

interface Skill {
	id: string;
	name: string;
	category: string;
	level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
}

interface CvFile {
	name: string;
	uploadedAt: string;
	skillsExtracted: number;
}

// --- Level config — bars convey level, chips stay neutral ---

const LEVEL_CONFIG: Record<Skill['level'], { label: string; bars: number }> = {
	beginner: { label: 'Beginner', bars: 1 },
	intermediate: { label: 'Intermediate', bars: 2 },
	advanced: { label: 'Advanced', bars: 3 },
	expert: { label: 'Expert', bars: 4 },
};

// --- Placeholder data — replace with API / query data ---

const cvFile: CvFile | null = {
	name: 'Samip_Pokharel_CV.pdf',
	uploadedAt: '3 days ago',
	skillsExtracted: 24,
};

const skills: Skill[] = [
	{ id: '1', name: 'React', category: 'Frontend', level: 'expert' },
	{ id: '2', name: 'TypeScript', category: 'Frontend', level: 'advanced' },
	{ id: '3', name: 'Tailwind CSS', category: 'Frontend', level: 'advanced' },
	{ id: '4', name: 'Node.js', category: 'Backend', level: 'intermediate' },
	{ id: '5', name: 'PostgreSQL', category: 'Backend', level: 'intermediate' },
	{ id: '6', name: 'Hono', category: 'Backend', level: 'beginner' },
	{ id: '7', name: 'Docker', category: 'DevOps', level: 'beginner' },
	{ id: '8', name: 'Figma', category: 'Design', level: 'intermediate' },
	{ id: '9', name: 'Next.js', category: 'Frontend', level: 'advanced' },
	{ id: '10', name: 'GraphQL', category: 'Backend', level: 'beginner' },
	{ id: '11', name: 'React Native', category: 'Mobile', level: 'intermediate' },
	{ id: '12', name: 'Drizzle ORM', category: 'Backend', level: 'intermediate' },
];

// Group skills by category
const skillsByCategory = skills.reduce<Record<string, Skill[]>>(
	(acc, skill) => {
		if (!acc[skill.category]) acc[skill.category] = [];
		acc[skill.category].push(skill);
		return acc;
	},
	{},
);

function SkillLevelBars({ level }: { level: Skill['level'] }) {
	const { bars } = LEVEL_CONFIG[level];
	return (
		<div className="flex items-end gap-0.5">
			{[1, 2, 3, 4].map((b) => (
				<div
					key={b}
					className={cn(
						'w-1 rounded-sm transition-all',
						b <= bars ? 'bg-accent opacity-80' : 'bg-muted-foreground/20',
						b === 1 && 'h-2',
						b === 2 && 'h-3',
						b === 3 && 'h-4',
						b === 4 && 'h-5',
					)}
				/>
			))}
		</div>
	);
}

export default function SkillsMain() {
	return (
		<>
			<TopBar
				title="Skills & CV"
				description="Your extracted skills power every roadmap we generate for you."
				action={
					<Button size="sm" className="gap-1.5">
						<Plus className="size-3.5" />
						Add Skill
					</Button>
				}
			/>

			<div className="flex flex-col gap-8 p-6 md:p-8">
				{/* CV upload card */}
				<Card className="rounded-xl border border-border/60 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
					<CardContent className="p-5">
						{cvFile ? (
							<div className="flex items-center justify-between gap-4">
								<div className="flex items-center gap-3">
									<div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent/[0.08]">
										<FileText className="size-5 text-accent" />
									</div>
									<div>
										<p className="text-base font-medium">{cvFile.name}</p>
										<p className="mt-0.5 text-xs text-muted-foreground">
											Uploaded {cvFile.uploadedAt} &middot;{' '}
											{cvFile.skillsExtracted} skills extracted
										</p>
									</div>
								</div>
								<div className="flex shrink-0 items-center gap-3">
									<span className="flex items-center gap-1 text-xs text-accent">
										<ShieldCheck className="size-4" />
										Verified
									</span>
									<Button variant="outline" size="sm" className="gap-1.5">
										<Upload className="size-3.5" />
										Replace
									</Button>
								</div>
							</div>
						) : (
							<div className="flex flex-col items-center gap-3 py-6 text-center">
								<div className="flex size-12 items-center justify-center rounded-2xl bg-muted">
									<Upload className="size-6 text-muted-foreground" />
								</div>
								<div>
									<p className="text-base font-medium">Upload your CV</p>
									<p className="mt-0.5 text-sm text-muted-foreground">
										We'll extract your skills automatically so every roadmap is
										tailored to you.
									</p>
								</div>
								<Button size="sm" className="gap-1.5">
									<Upload className="size-3.5" />
									Upload CV
								</Button>
							</div>
						)}
					</CardContent>
				</Card>

				{/* Skills by category */}
				<div className="flex flex-col gap-6">
					<div className="flex items-center justify-between">
						<h2 className="text-xl font-semibold tracking-tight">
							Your Skills{' '}
							<span className="ml-1 text-sm font-normal text-muted-foreground">
								({skills.length})
							</span>
						</h2>
						<Button variant="ghost" size="sm" className="gap-1 text-xs">
							See gaps across roadmaps
							<ArrowRight className="size-3.5" />
						</Button>
					</div>

					{Object.entries(skillsByCategory).map(
						([category, categorySkills]) => (
							<div key={category} className="flex flex-col gap-3">
								<div className="flex items-center gap-2">
									<span className="text-xs font-medium text-muted-foreground">
										{category}
									</span>
									<div className="h-px flex-1 bg-border" />
								</div>

								<div className="flex flex-wrap gap-2">
									{categorySkills.map((skill) => {
										const config = LEVEL_CONFIG[skill.level];
										return (
											<div
												key={skill.id}
												className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-sm"
											>
												<SkillLevelBars level={skill.level} />
												<span className="font-medium">{skill.name}</span>
												<span className="text-xs text-muted-foreground">
													{config.label}
												</span>
											</div>
										);
									})}
									<button
										type="button"
										className="flex items-center gap-1.5 rounded-xl border border-dashed border-muted-foreground/30 px-3 py-2 text-sm text-muted-foreground transition-colors hover:border-muted-foreground/60 hover:text-foreground"
									>
										<Plus className="size-3.5" />
										Add
									</button>
								</div>
							</div>
						),
					)}
				</div>
			</div>
		</>
	);
}
