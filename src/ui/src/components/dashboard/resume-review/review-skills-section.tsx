import { useState } from 'react';
import { Check, Pencil, Plus, X } from 'lucide-react';

import { BrandIcon } from '@/components/dashboard/brand-icon';
import { Input } from '@/components/ui/input';
import {
	lookupSkillCategory,
	SKILL_CATEGORY_ORDER,
} from '@/data/skill-catalog';
import { getSkillIcon } from '@/lib/skill-icon';

import { categorizeSkills } from './utils';

interface ReviewSkillsSectionProps {
	skills: string[];
	onChange: (skills: string[]) => void;
}

interface EditableSkill {
	id: string;
	name: string;
	category: string;
}

export function ReviewSkillsSection({
	skills,
	onChange,
}: ReviewSkillsSectionProps) {
	const [adding, setAdding] = useState(false);
	const [draft, setDraft] = useState('');
	const [managing, setManaging] = useState(false);
	const [editableSkills, setEditableSkills] = useState<EditableSkill[]>([]);

	const remove = (skill: string) => onChange(skills.filter((s) => s !== skill));

	const commit = () => {
		const trimmed = draft.trim();
		if (trimmed && !skills.includes(trimmed)) {
			onChange([...skills, trimmed]);
		}
		setDraft('');
		setAdding(false);
	};

	const enterManage = () => {
		setEditableSkills(
			skills.map((s, i) => ({
				id: `${i}-${s}`,
				name: s,
				category: lookupSkillCategory(s) ?? 'Other',
			})),
		);
		setManaging(true);
	};

	const doneManage = () => {
		onChange(editableSkills.map((s) => s.name.trim()).filter(Boolean));
		setManaging(false);
	};

	const updateSkill = (id: string, patch: Partial<EditableSkill>) => {
		setEditableSkills((prev) =>
			prev.map((s) => (s.id === id ? { ...s, ...patch } : s)),
		);
	};

	const removeEditableSkill = (id: string) => {
		setEditableSkills((prev) => prev.filter((s) => s.id !== id));
	};

	const addEditableSkill = () => {
		setEditableSkills((prev) => [
			...prev,
			{ id: `new-${Date.now()}`, name: '', category: 'Other' },
		]);
	};

	const categories = categorizeSkills(skills);

	if (managing) {
		return (
			<div className="border-border/50 bg-card rounded-xl border p-4 shadow-[0_2px_8px_rgba(0,0,0,0.03)]">
				<div className="mb-3 flex items-center justify-between">
					<p className="text-sm font-medium">Manage Skills</p>
					<button
						type="button"
						onClick={doneManage}
						className="text-accent hover:text-accent/80 flex items-center gap-1 text-xs transition-colors"
					>
						<Check className="size-3.5" />
						Done
					</button>
				</div>

				<div className="flex max-h-72 flex-col gap-2 overflow-y-auto">
					{editableSkills.map((s) => {
						const icon = getSkillIcon(s.name);
						return (
							<div key={s.id} className="flex items-center gap-2">
								<div className="flex size-5 shrink-0 items-center justify-center">
									{icon ? (
										<BrandIcon name={icon} size={14} className="opacity-60" />
									) : (
										<div className="bg-muted-foreground/30 size-1.5 rounded-full" />
									)}
								</div>
								<Input
									value={s.name}
									onChange={(e) => updateSkill(s.id, { name: e.target.value })}
									className="h-7 min-w-0 flex-1 text-sm"
									placeholder="Skill name"
								/>
								<select
									value={s.category}
									onChange={(e) =>
										updateSkill(s.id, { category: e.target.value })
									}
									className="border-border/50 bg-muted/40 text-muted-foreground focus:border-ring focus:ring-ring/50 h-7 rounded-lg border px-2 text-xs outline-none focus:ring-1"
								>
									{SKILL_CATEGORY_ORDER.map((cat) => (
										<option key={cat} value={cat}>
											{cat}
										</option>
									))}
								</select>
								<button
									type="button"
									onClick={() => removeEditableSkill(s.id)}
									className="text-muted-foreground/40 hover:text-destructive shrink-0 transition-colors"
									aria-label={`Remove ${s.name}`}
								>
									<X className="size-3.5" />
								</button>
							</div>
						);
					})}
				</div>

				<button
					type="button"
					onClick={addEditableSkill}
					className="border-border text-muted-foreground/60 hover:text-muted-foreground mt-3 flex items-center gap-1 rounded-md border border-dashed px-2.5 py-1 text-sm transition-colors"
				>
					<Plus className="size-3" />
					Add skill
				</button>
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-5">
			{categories.map(([category, categorySkills]) => (
				<div key={category}>
					<p className="text-muted-foreground/60 mb-2 text-[10px] font-semibold uppercase tracking-widest">
						{category} · {categorySkills.length}
					</p>
					<div className="flex flex-wrap gap-1.5">
						{categorySkills.map((skill) => {
							const icon = getSkillIcon(skill);
							return (
								<span
									key={skill}
									className="bg-foreground/[0.06] text-foreground/80 flex items-center gap-1.5 rounded-md px-2.5 py-1 text-sm"
								>
									{icon && (
										<BrandIcon
											name={icon}
											size={13}
											className="shrink-0 opacity-60"
										/>
									)}
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
							);
						})}
					</div>
				</div>
			))}

			<div className="flex items-center gap-2">
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
						className="border-border text-muted-foreground/60 hover:text-muted-foreground flex items-center gap-1 rounded-md border border-dashed px-2.5 py-1 text-sm transition-colors"
					>
						<Plus className="size-3" />
						Add skill
					</button>
				)}
				<button
					type="button"
					onClick={enterManage}
					className="text-muted-foreground/50 hover:text-muted-foreground flex items-center gap-1 text-xs transition-colors"
				>
					<Pencil className="size-3" />
					Edit skills
				</button>
			</div>
		</div>
	);
}
