import { useState } from 'react';
import { Check, Globe, Mail, MapPin, Pencil, Phone, X } from 'lucide-react';
import type { ResumeExtractionType } from '@uppler/types';

import { BrandIcon } from '@/components/dashboard/brand-icon';
import type { BrandIconName } from '@/components/dashboard/brand-icon/brand-icons.types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

const VCS_ICON: Record<string, BrandIconName> = {
	GitHub: 'GitHub',
	GitLab: 'GitLab',
	Bitbucket: 'BitBucket',
	Azure: 'Azure',
	AWS: 'AWS',
};

type ProfileFields = Pick<
	ResumeExtractionType,
	'full_name' | 'contact_details'
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
	value: string | null | undefined;
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
			<Button
				type="button"
				variant="ghost"
				onClick={() => setEditing(true)}
				className={cn(
					'h-auto gap-1.5 p-0 text-left font-normal hover:bg-transparent',
					!value && 'text-muted-foreground/40 italic',
					className,
				)}
			>
				<span>{value || (placeholder ?? `Add ${label.toLowerCase()}`)}</span>
				<Pencil className="text-muted-foreground/40 size-3 shrink-0 opacity-0 transition group-hover:opacity-100" />
			</Button>
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
			<Button
				type="button"
				variant="ghost"
				size="icon"
				onClick={commit}
				className="text-accent hover:text-accent/80 size-6 shrink-0"
				aria-label="Save"
			>
				<Check className="size-3.5" />
			</Button>
			<Button
				type="button"
				variant="ghost"
				size="icon"
				onClick={discard}
				className="text-muted-foreground hover:text-foreground size-6 shrink-0"
				aria-label="Discard"
			>
				<X className="size-3.5" />
			</Button>
		</div>
	);
}

export function ReviewProfileSection({
	data,
	onChange,
}: ReviewProfileSectionProps) {
	const setContact = (
		key: keyof ResumeExtractionType['contact_details'],
		value: string,
	) =>
		onChange({
			...data,
			contact_details: {
				...data.contact_details,
				[key]: value || null,
			},
		});

	const cd = data.contact_details;

	return (
		<div className="flex gap-4">
			<div className="bg-accent/[0.1] text-accent flex size-14 shrink-0 items-center justify-center rounded-2xl text-xl font-semibold">
				{data.full_name?.[0]?.toUpperCase() ?? '?'}
			</div>

			<div className="flex min-w-0 flex-1 flex-col gap-2">
				<EditableField
					label="Full name"
					value={data.full_name}
					onSave={(v) => onChange({ ...data, full_name: v || null })}
					className="text-xl font-semibold"
				/>

				<div className="flex flex-wrap items-center gap-x-3 gap-y-1">
					<div className="flex items-center gap-1.5">
						<Mail className="text-muted-foreground/40 size-3 shrink-0" />
						<EditableField
							label="Email"
							value={cd.email}
							onSave={(v) => setContact('email', v)}
							className="text-muted-foreground text-sm"
						/>
					</div>
					<div className="flex items-center gap-1.5">
						<Phone className="text-muted-foreground/40 size-3 shrink-0" />
						<EditableField
							label="Phone"
							value={cd.phone}
							onSave={(v) => setContact('phone', v)}
							className="text-muted-foreground text-sm"
						/>
					</div>
					<div className="flex items-center gap-1.5">
						<MapPin className="text-muted-foreground/40 size-3 shrink-0" />
						<EditableField
							label="Location"
							value={cd.location}
							onSave={(v) => setContact('location', v)}
							className="text-muted-foreground text-sm"
						/>
					</div>
				</div>

				<div className="flex flex-wrap gap-x-4 gap-y-1.5 pt-0.5">
					<div className="flex items-center gap-1.5">
						<BrandIcon
							name="LinkedIn"
							size={14}
							className="shrink-0 opacity-60"
						/>
						<EditableField
							label="LinkedIn URL"
							value={cd.linkedin}
							placeholder="Add LinkedIn"
							onSave={(v) => setContact('linkedin', v)}
							className="text-muted-foreground text-xs"
						/>
					</div>
					<div className="flex items-center gap-1.5">
						<BrandIcon
							name={VCS_ICON[cd.vcs_platform ?? ''] ?? 'GitHub'}
							size={14}
							className="shrink-0 opacity-60"
						/>
						<EditableField
							label={cd.vcs_platform ? `${cd.vcs_platform} URL` : 'VCS URL'}
							value={cd.vcs_url}
							placeholder="Add VCS profile"
							onSave={(v) => setContact('vcs_url', v)}
							className="text-muted-foreground text-xs"
						/>
					</div>
					<div className="flex items-center gap-1.5">
						<Globe className="text-muted-foreground/50 size-3.5 shrink-0" />
						<EditableField
							label="Portfolio URL"
							value={cd.portfolio}
							placeholder="Add portfolio"
							onSave={(v) => setContact('portfolio', v)}
							className="text-muted-foreground text-xs"
						/>
					</div>
				</div>
			</div>
		</div>
	);
}
