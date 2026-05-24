import { Plus, Sparkles } from 'lucide-react';

import { Button } from '@/components/ui/button';

export function SkillsEmptyState({ onAdd }: { onAdd: () => void }) {
	return (
		<div className="flex flex-col items-center gap-4 py-12 text-center">
			<div className="bg-accent/[0.08] rounded-xl p-3">
				<Sparkles className="text-accent size-5" />
			</div>
			<div className="flex flex-col gap-1">
				<p className="text-foreground text-sm font-medium">No skills yet</p>
				<p className="text-muted-foreground text-sm">
					Add your first skill to start building your profile.
				</p>
			</div>
			<Button size="sm" onClick={onAdd} className="gap-1.5">
				<Plus className="size-3.5" />
				Add your first skill
			</Button>
		</div>
	);
}
