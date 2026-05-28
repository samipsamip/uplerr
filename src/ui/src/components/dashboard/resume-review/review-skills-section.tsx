import { useState } from 'react';
import { Plus, X } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface ReviewSkillsSectionProps {
	skills: string[];
	onChange: (skills: string[]) => void;
}

export function ReviewSkillsSection({
	skills,
	onChange,
}: ReviewSkillsSectionProps) {
	const [adding, setAdding] = useState(false);
	const [draft, setDraft] = useState('');

	const remove = (skill: string) => onChange(skills.filter((s) => s !== skill));

	const commit = () => {
		const trimmed = draft.trim();
		if (trimmed && !skills.includes(trimmed)) {
			onChange([...skills, trimmed]);
		}
		setDraft('');
		setAdding(false);
	};

	return (
		<div className="flex flex-wrap gap-2">
			{skills.map((skill) => (
				<span
					key={skill}
					className={cn(
						'bg-accent/[0.08] text-accent group flex items-center gap-1 rounded-full px-3 py-1 text-sm font-medium',
					)}
				>
					{skill}
					<button
						type="button"
						onClick={() => remove(skill)}
						className="text-accent/50 hover:text-accent ml-0.5 transition-colors"
						aria-label={`Remove ${skill}`}
					>
						<X className="size-3" />
					</button>
				</span>
			))}

			{adding ? (
				<div className="flex items-center gap-1">
					<Input
						value={draft}
						onChange={(e) => setDraft(e.target.value)}
						onKeyDown={(e) => {
							if (e.key === 'Enter') commit();
							if (e.key === 'Escape') {
								setDraft('');
								setAdding(false);
							}
						}}
						className="h-7 w-32 rounded-full px-3 text-sm"
						placeholder="Skill name"
						autoFocus
						onBlur={commit}
					/>
				</div>
			) : (
				<button
					type="button"
					onClick={() => setAdding(true)}
					className="border-border text-muted-foreground hover:text-foreground hover:border-border/80 flex items-center gap-1 rounded-full border border-dashed px-3 py-1 text-sm transition-colors"
				>
					<Plus className="size-3" />
					Add skill
				</button>
			)}
		</div>
	);
}
