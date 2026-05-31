import { useState } from 'react';
import { ArrowRight, Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import type { UserSkill } from '@/network/user-skills.service';
import { useGetUserSkills } from '@/query/user-skills.query';

import AddSkillsDialog from './add-skills-dialog';
import { SkillCard } from './skill-card';
import { SkillsEmptyState } from './skills-empty-state';

export function SkillsList() {
	const [openDialog, setOpenDialog] = useState(false);
	const { data: skills = [] } = useGetUserSkills();

	const skillsByCategory = skills.reduce<Record<string, UserSkill[]>>(
		(acc, skill) => {
			if (!acc[skill.category]) acc[skill.category] = [];
			acc[skill.category].push(skill);
			return acc;
		},
		{},
	);

	const isEmpty = skills.length === 0;

	return (
		<div className="flex flex-col gap-6">
			<div className="flex items-center justify-between">
				<h2 className="text-xl font-semibold tracking-tight">
					Your Skills
					{!isEmpty && (
						<span className="text-muted-foreground ml-1 text-sm font-normal">
							({skills.length})
						</span>
					)}
				</h2>
				{!isEmpty && (
					<Button variant="ghost" size="sm" className="gap-1 text-xs">
						See gaps across roadmaps
						<ArrowRight className="size-3.5" />
					</Button>
				)}
			</div>

			{isEmpty ? (
				<SkillsEmptyState onAdd={() => setOpenDialog(true)} />
			) : (
				Object.entries(skillsByCategory).map(([category, categorySkills]) => (
					<div key={category} className="flex flex-col gap-3">
						<div className="flex items-center gap-2">
							<span className="text-muted-foreground text-xs font-medium">
								{category}
							</span>
							<div className="bg-border h-px flex-1" />
						</div>
						<div className="flex flex-wrap gap-2">
							{categorySkills.map((skill) => (
								<SkillCard key={skill.id} skill={skill} />
							))}
							<Button
								onClick={() => setOpenDialog(true)}
								type="button"
								variant="outline"
								size="sm"
								className="border-muted-foreground/30 text-muted-foreground hover:border-muted-foreground/60 hover:text-foreground gap-1.5 rounded-xl border-dashed"
							>
								<Plus className="size-3.5" />
								Add
							</Button>
						</div>
					</div>
				))
			)}

			<AddSkillsDialog open={openDialog} onOpenDialog={setOpenDialog} />
		</div>
	);
}
