import { useState } from 'react';
import { Plus, X } from 'lucide-react';

import { Input } from '@/components/ui/input';

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
					className="bg-foreground/[0.07] text-foreground/80 flex items-center gap-1.5 rounded-md px-2.5 py-1 text-sm"
				>
					{skill}
					<button
						type="button"
						onClick={() => remove(skill)}
						className="text-foreground/30 hover:text-foreground/70 ml-0.5 transition-colors"
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
						className="h-7 w-36 text-sm"
						placeholder="Skill name"
						autoFocus
						onBlur={commit}
					/>
				</div>
			) : (
				<button
					type="button"
					onClick={() => setAdding(true)}
					className="border-border text-muted-foreground hover:text-foreground flex items-center gap-1 rounded-md border border-dashed px-2.5 py-1 text-sm transition-colors"
				>
					<Plus className="size-3" />
					Add skill
				</button>
			)}
		</div>
	);
}
