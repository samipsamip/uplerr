import { ArrowRight, Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface Skill {
	id: string;
	name: string;
	category: string;
	level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
}

const LEVEL_CONFIG: Record<Skill['level'], { label: string; bars: number }> = {
	beginner: { label: 'Beginner', bars: 1 },
	intermediate: { label: 'Intermediate', bars: 2 },
	advanced: { label: 'Advanced', bars: 3 },
	expert: { label: 'Expert', bars: 4 },
};

// --- Placeholder data — replace with API / query data ---
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

export function SkillsList() {
	const skillsByCategory = skills.reduce<Record<string, Skill[]>>(
		(acc, skill) => {
			if (!acc[skill.category]) acc[skill.category] = [];
			acc[skill.category].push(skill);
			return acc;
		},
		{},
	);

	return (
		<div className="flex flex-col gap-6">
			<div className="flex items-center justify-between">
				<h2 className="text-xl font-semibold tracking-tight">
					Your Skills{' '}
					<span className="text-muted-foreground ml-1 text-sm font-normal">
						({skills.length})
					</span>
				</h2>
				<Button variant="ghost" size="sm" className="gap-1 text-xs">
					See gaps across roadmaps
					<ArrowRight className="size-3.5" />
				</Button>
			</div>

			{Object.entries(skillsByCategory).map(([category, categorySkills]) => (
				<div key={category} className="flex flex-col gap-3">
					<div className="flex items-center gap-2">
						<span className="text-muted-foreground text-xs font-medium">
							{category}
						</span>
						<div className="bg-border h-px flex-1" />
					</div>
					<div className="flex flex-wrap gap-2">
						{categorySkills.map((skill) => {
							const config = LEVEL_CONFIG[skill.level];
							return (
								<div
									key={skill.id}
									className="border-border bg-card flex items-center gap-2 rounded-xl border px-3 py-2 text-sm"
								>
									<SkillLevelBars level={skill.level} />
									<span className="font-medium">{skill.name}</span>
									<span className="text-muted-foreground text-xs">
										{config.label}
									</span>
								</div>
							);
						})}
						<button
							type="button"
							className="border-muted-foreground/30 text-muted-foreground hover:border-muted-foreground/60 hover:text-foreground flex items-center gap-1.5 rounded-xl border border-dashed px-3 py-2 text-sm transition-colors"
						>
							<Plus className="size-3.5" />
							Add
						</button>
					</div>
				</div>
			))}
		</div>
	);
}
