import { useState } from 'react';
import { Cable, Check, GitFork, Globe, Pencil, X } from 'lucide-react';
import type { ResumeStructuredData } from '@uppler/types';

import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

type ProfileFields = Pick<
	ResumeStructuredData,
	'name' | 'email' | 'phone' | 'location' | 'links'
>;

interface ReviewProfileSectionProps {
	data: ProfileFields;
	onChange: (updated: ProfileFields) => void;
}

function EditableField({
	label,
	value,
	onSave,
	className,
	placeholder,
}: {
	label: string;
	value: string | undefined;
	onSave: (v: string) => void;
	className?: string;
	placeholder?: string;
}) {
	const [editing, setEditing] = useState(false);
	const [draft, setDraft] = useState(value ?? '');

	const commit = () => {
		onSave(draft);
		setEditing(false);
	};
	const discard = () => {
		setDraft(value ?? '');
		setEditing(false);
	};

	if (!editing) {
		return (
			<button
				type="button"
				onClick={() => setEditing(true)}
				className={cn(
					'group flex items-center gap-1.5 text-left',
					!value && 'text-muted-foreground/40 italic',
					className,
				)}
			>
				<span>{value || (placeholder ?? `Add ${label.toLowerCase()}`)}</span>
				<Pencil className="text-muted-foreground/40 group-hover:text-muted-foreground size-3 shrink-0 opacity-0 transition group-hover:opacity-100" />
			</button>
		);
	}

	return (
		<div className="flex items-center gap-1.5">
			<Input
				value={draft}
				onChange={(e) => setDraft(e.target.value)}
				onKeyDown={(e) => {
					if (e.key === 'Enter') commit();
					if (e.key === 'Escape') discard();
				}}
				className="h-7 text-sm"
				placeholder={label}
				autoFocus
			/>
			<button
				type="button"
				onClick={commit}
				className="text-accent hover:text-accent/80 shrink-0"
				aria-label="Save"
			>
				<Check className="size-3.5" />
			</button>
			<button
				type="button"
				onClick={discard}
				className="text-muted-foreground hover:text-foreground shrink-0"
				aria-label="Discard"
			>
				<X className="size-3.5" />
			</button>
		</div>
	);
}

export function ReviewProfileSection({
	data,
	onChange,
}: ReviewProfileSectionProps) {
	const set = <K extends keyof ProfileFields>(
		key: K,
		value: ProfileFields[K],
	) => onChange({ ...data, [key]: value });

	const setLink = (
		key: keyof NonNullable<ProfileFields['links']>,
		value: string,
	) =>
		onChange({ ...data, links: { ...data.links, [key]: value || undefined } });

	return (
		<div className="bg-accent/[0.04] ring-accent/10 rounded-2xl p-5 ring-1">
			<div className="flex gap-4">
				{/* Avatar */}
				<div className="bg-accent/[0.1] text-accent flex size-16 shrink-0 items-center justify-center rounded-2xl text-2xl font-semibold">
					{data.name?.[0]?.toUpperCase() ?? '?'}
				</div>

				{/* Name + contact */}
				<div className="flex min-w-0 flex-1 flex-col gap-2">
					<EditableField
						label="Full name"
						value={data.name}
						onSave={(v) => set('name', v)}
						className="text-xl font-semibold"
					/>

					<div className="flex flex-wrap items-center gap-x-2 gap-y-1">
						<EditableField
							label="Email"
							value={data.email}
							onSave={(v) => set('email', v || undefined)}
							className="text-muted-foreground text-sm"
						/>
						{(data.email || data.phone) && (
							<span className="text-border select-none text-sm">·</span>
						)}
						<EditableField
							label="Phone"
							value={data.phone}
							onSave={(v) => set('phone', v || undefined)}
							className="text-muted-foreground text-sm"
						/>
						{(data.phone || data.location) && (
							<span className="text-border select-none text-sm">·</span>
						)}
						<EditableField
							label="Location"
							value={data.location}
							onSave={(v) => set('location', v || undefined)}
							className="text-muted-foreground text-sm"
						/>
					</div>

					{/* Links — icon-only labels, no duplicate text */}
					<div className="flex flex-wrap gap-x-4 gap-y-1.5 pt-0.5">
						<div className="flex items-center gap-1.5">
							<Cable className="text-muted-foreground/50 size-3.5 shrink-0" />
							<EditableField
								label="LinkedIn URL"
								value={data.links?.linkedin}
								placeholder="Add LinkedIn"
								onSave={(v) => setLink('linkedin', v)}
								className="text-muted-foreground text-xs"
							/>
						</div>
						<div className="flex items-center gap-1.5">
							<GitFork className="text-muted-foreground/50 size-3.5 shrink-0" />
							<EditableField
								label="GitHub URL"
								value={data.links?.github}
								placeholder="Add GitHub"
								onSave={(v) => setLink('github', v)}
								className="text-muted-foreground text-xs"
							/>
						</div>
						<div className="flex items-center gap-1.5">
							<Globe className="text-muted-foreground/50 size-3.5 shrink-0" />
							<EditableField
								label="Portfolio URL"
								value={data.links?.portfolio}
								placeholder="Add portfolio"
								onSave={(v) => setLink('portfolio', v)}
								className="text-muted-foreground text-xs"
							/>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
