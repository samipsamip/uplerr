import { useState } from 'react';
import { Pencil } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { UserSkill } from '@/network/user-skills.service';

import { EditSkillDialog } from './edit-skill-dialog';

type SkillLevel = UserSkill['level'];

const LEVEL_CONFIG: Record<SkillLevel, { label: string; bars: number }> = {
	beginner: { label: 'Beginner', bars: 1 },
	intermediate: { label: 'Intermediate', bars: 2 },
	advanced: { label: 'Advanced', bars: 3 },
	expert: { label: 'Expert', bars: 4 },
};

function SkillLevelBars({ level }: { level: SkillLevel }) {
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

export function SkillCard({ skill }: { skill: UserSkill }) {
	const [open, setOpen] = useState(false);
	const { label } = LEVEL_CONFIG[skill.level];

	return (
		<>
			<div className="border-border bg-card group relative flex items-center gap-2 rounded-xl border px-3 py-2 text-sm">
				<SkillLevelBars level={skill.level} />
				<span className="font-medium">{skill.name}</span>
				<span className="text-muted-foreground text-xs">{label}</span>
				<Button
					type="button"
					variant="ghost"
					size="icon"
					onClick={() => setOpen(true)}
					className="text-muted-foreground/40 hover:text-muted-foreground ml-0.5 size-5 opacity-0 transition-opacity group-hover:opacity-100"
					aria-label={`Edit ${skill.name}`}
				>
					<Pencil className="size-3" />
				</Button>
			</div>

			<EditSkillDialog skill={skill} open={open} onOpenChange={setOpen} />
		</>
	);
}
