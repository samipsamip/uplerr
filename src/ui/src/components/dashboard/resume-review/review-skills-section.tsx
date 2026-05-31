import { useState } from 'react';
import { Check, Plus, X } from 'lucide-react';
import type { SkillExtractionType } from '@uppler/types';

import { BrandIcon } from '@/components/dashboard/brand-icon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getSkillIcon } from '@/lib/skill-icon';

type SkillItem = SkillExtractionType['technical_skills'][number];

type SkillGroup = {
	key: keyof SkillExtractionType;
	label: string;
};

const SKILL_GROUPS: SkillGroup[] = [
	{ key: 'technical_skills', label: 'Technical' },
	{ key: 'tools_platforms', label: 'Tools & Platforms' },
	{ key: 'spoken_languages', label: 'Languages' },
	{ key: 'soft_skills', label: 'Soft Skills' },
];

interface ReviewSkillsSectionProps {
	skills: SkillExtractionType;
	onChange: (skills: SkillExtractionType) => void;
}

function SkillChip({
	skill,
	onRemove,
}: {
	skill: SkillItem;
	onRemove: () => void;
}) {
	const icon = getSkillIcon(skill.name);
	return (
		<span className="bg-muted/70 text-foreground/80 flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-sm">
			{icon && (
				<BrandIcon name={icon} size={14} className="shrink-0 opacity-70" />
			)}
			{skill.name}
			<Button
				type="button"
				variant="ghost"
				size="icon"
				onClick={onRemove}
				className="text-muted-foreground/40 hover:text-destructive ml-0.5 size-4"
				aria-label={`Remove ${skill.name}`}
			>
				<X className="size-3" />
			</Button>
		</span>
	);
}

function SkillGroupSection({
	label,
	skills,
	onUpdate,
}: {
	label: string;
	skills: SkillItem[];
	onUpdate: (updated: SkillItem[]) => void;
}) {
	const [adding, setAdding] = useState(false);
	const [draft, setDraft] = useState('');

	const remove = (name: string) =>
		onUpdate(skills.filter((s) => s.name !== name));

	const commit = () => {
		const trimmed = draft.trim();
		if (
			trimmed &&
			!skills.some((s) => s.name.toLowerCase() === trimmed.toLowerCase())
		) {
			onUpdate([
				...skills,
				{ name: trimmed, source: 'skills_section' as const },
			]);
		}
		setDraft('');
		setAdding(false);
	};

	return (
		<div className="flex flex-col gap-2">
			<p className="text-muted-foreground/50 text-[11px] font-semibold uppercase tracking-wide">
				{label}
			</p>
			<div className="flex flex-wrap gap-1.5">
				{skills.map((s) => (
					<SkillChip key={s.name} skill={s} onRemove={() => remove(s.name)} />
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
							className="h-7 w-32 text-sm"
							placeholder="Skill name"
							autoFocus
						/>
						<Button
							type="button"
							variant="ghost"
							size="icon"
							onClick={commit}
							className="text-accent hover:text-accent/80 size-6"
							aria-label="Add"
						>
							<Check className="size-3.5" />
						</Button>
						<Button
							type="button"
							variant="ghost"
							size="icon"
							onClick={() => {
								setDraft('');
								setAdding(false);
							}}
							className="text-muted-foreground hover:text-foreground size-6"
							aria-label="Cancel"
						>
							<X className="size-3.5" />
						</Button>
					</div>
				) : (
					<Button
						type="button"
						variant="outline"
						size="sm"
						onClick={() => setAdding(true)}
						className="text-muted-foreground/40 hover:text-muted-foreground gap-0.5 rounded-lg border-dashed px-2 text-xs"
					>
						<Plus className="size-3" />
						Add
					</Button>
				)}
			</div>
		</div>
	);
}

export function ReviewSkillsSection({
	skills,
	onChange,
}: ReviewSkillsSectionProps) {
	const update = (key: keyof SkillExtractionType, items: SkillItem[]) =>
		onChange({ ...skills, [key]: items });

	return (
		<div className="flex flex-col gap-5">
			{SKILL_GROUPS.map(({ key, label }) => (
				<SkillGroupSection
					key={key}
					label={label}
					skills={skills[key]}
					onUpdate={(items) => update(key, items)}
				/>
			))}
		</div>
	);
}
