import { useState } from 'react';
import { Check, Pencil, X } from 'lucide-react';
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
}: {
	label: string;
	value: string | undefined;
	onSave: (v: string) => void;
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
					!value && 'text-muted-foreground/50 italic',
				)}
			>
				<span className="text-sm">{value || `Add ${label.toLowerCase()}`}</span>
				<Pencil className="text-muted-foreground/40 group-hover:text-muted-foreground size-3 opacity-0 transition group-hover:opacity-100" />
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
				className="text-accent hover:text-accent/80"
				aria-label="Save"
			>
				<Check className="size-3.5" />
			</button>
			<button
				type="button"
				onClick={discard}
				className="text-muted-foreground hover:text-foreground"
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
		<div className="flex flex-col gap-5">
			<div className="flex items-start gap-4">
				<div className="bg-accent/[0.08] flex size-12 shrink-0 items-center justify-center rounded-2xl text-xl font-semibold">
					{data.name?.[0]?.toUpperCase() ?? '?'}
				</div>
				<div className="flex flex-col gap-0.5">
					<EditableField
						label="Full name"
						value={data.name}
						onSave={(v) => set('name', v)}
					/>
					<div className="flex flex-wrap gap-x-4 gap-y-1 pt-0.5">
						<EditableField
							label="Email"
							value={data.email}
							onSave={(v) => set('email', v || undefined)}
						/>
						<EditableField
							label="Phone"
							value={data.phone}
							onSave={(v) => set('phone', v || undefined)}
						/>
						<EditableField
							label="Location"
							value={data.location}
							onSave={(v) => set('location', v || undefined)}
						/>
					</div>
				</div>
			</div>

			{(data.links?.linkedin ||
				data.links?.github ||
				data.links?.portfolio) && (
				<div className="flex flex-wrap gap-x-6 gap-y-1 pl-16">
					<div className="flex items-center gap-1.5">
						<span className="text-muted-foreground w-16 text-xs">LinkedIn</span>
						<EditableField
							label="LinkedIn URL"
							value={data.links?.linkedin}
							onSave={(v) => setLink('linkedin', v)}
						/>
					</div>
					<div className="flex items-center gap-1.5">
						<span className="text-muted-foreground w-16 text-xs">GitHub</span>
						<EditableField
							label="GitHub URL"
							value={data.links?.github}
							onSave={(v) => setLink('github', v)}
						/>
					</div>
					<div className="flex items-center gap-1.5">
						<span className="text-muted-foreground w-16 text-xs">
							Portfolio
						</span>
						<EditableField
							label="Portfolio URL"
							value={data.links?.portfolio}
							onSave={(v) => setLink('portfolio', v)}
						/>
					</div>
				</div>
			)}
		</div>
	);
}
