import { useEffect, useState } from 'react';
import type { DateRange } from 'react-day-picker';
import { format, isValid, parse } from 'date-fns';
import { CalendarIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface DurationRangePickerProps {
	value: string | undefined;
	onChange: (value: string | undefined) => void;
	className?: string;
}

const MONTH_FORMATS = ['yyyy-MM', 'MMM yyyy', 'MMMM yyyy'];

function parseMonth(s: string): Date | null {
	s = s.trim();
	for (const fmt of MONTH_FORMATS) {
		try {
			const d = parse(s, fmt, new Date());
			if (isValid(d)) return d;
		} catch {
			// try next
		}
	}
	// "2022" bare year
	if (/^\d{4}$/.test(s)) return new Date(parseInt(s), 0, 1);
	return null;
}

function parseDurationString(value: string | undefined): {
	from: Date | undefined;
	to: Date | undefined;
	isPresent: boolean;
} {
	if (!value) return { from: undefined, to: undefined, isPresent: false };

	const parts = value.split(/\s*(?:[-–—]|to)\s*/i);
	if (parts.length < 2)
		return {
			from: parseMonth(parts[0]) ?? undefined,
			to: undefined,
			isPresent: false,
		};

	const from = parseMonth(parts[0]) ?? undefined;
	const toRaw = parts[1].trim().toLowerCase();
	const isPresent =
		toRaw === 'present' || toRaw === 'now' || toRaw === 'current';
	const to = isPresent ? undefined : (parseMonth(parts[1]) ?? undefined);

	return { from, to, isPresent };
}

function formatDuration(
	from: Date | undefined,
	to: Date | undefined,
	isPresent: boolean,
): string | undefined {
	if (!from) return undefined;
	const start = format(from, 'MMM yyyy');
	if (isPresent) return `${start} – Present`;
	if (to) return `${start} – ${format(to, 'MMM yyyy')}`;
	return start;
}

export function DurationRangePicker({
	value,
	onChange,
	className,
}: DurationRangePickerProps) {
	const parsed = parseDurationString(value);
	const [range, setRange] = useState<DateRange | undefined>({
		from: parsed.from,
		to: parsed.to,
	});
	const [isPresent, setIsPresent] = useState(parsed.isPresent);
	const [open, setOpen] = useState(false);

	// Sync when external value changes
	useEffect(() => {
		const p = parseDurationString(value);
		setRange({ from: p.from, to: p.to });
		setIsPresent(p.isPresent);
	}, [value]);

	const handleSelect = (r: DateRange | undefined) => {
		setRange(r);
		const newValue = formatDuration(
			r?.from,
			isPresent ? undefined : r?.to,
			isPresent,
		);
		onChange(newValue);
	};

	const handlePresentToggle = () => {
		const next = !isPresent;
		setIsPresent(next);
		const newValue = formatDuration(
			range?.from,
			next ? undefined : range?.to,
			next,
		);
		onChange(newValue);
	};

	const displayLabel = value || 'Select duration';
	const hasValue = !!range?.from;

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button
					type="button"
					variant="outline"
					className={cn(
						'border-border/50 bg-muted/40 h-8 w-full justify-start gap-2 rounded-lg px-3 text-sm font-normal',
						!hasValue && 'text-muted-foreground/50',
						className,
					)}
				>
					<CalendarIcon className="text-muted-foreground/50 size-3.5 shrink-0" />
					<span className="flex-1 truncate text-left">{displayLabel}</span>
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-auto p-0" align="start">
				<Calendar
					mode="range"
					selected={range}
					onSelect={handleSelect}
					captionLayout="dropdown"
					startMonth={new Date(1990, 0)}
					endMonth={new Date()}
					numberOfMonths={2}
					{...(isPresent && range?.from
						? { disabled: { after: range.from } }
						: {})}
				/>
				<div className="border-border/40 border-t px-4 py-3">
					<div className="flex cursor-pointer items-center gap-2">
						<Checkbox
							id="is-present"
							checked={isPresent}
							onCheckedChange={handlePresentToggle}
						/>
						<Label
							htmlFor="is-present"
							className="text-foreground/70 cursor-pointer text-sm"
						>
							Currently working here
						</Label>
					</div>
				</div>
			</PopoverContent>
		</Popover>
	);
}
