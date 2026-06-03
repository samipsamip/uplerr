import type { FieldErrors, UseFormRegister } from 'react-hook-form';

import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import type { RoadmapFormValues } from './create-roadmap-modal';

type Props = {
	register: UseFormRegister<RoadmapFormValues>;
	errors: FieldErrors<RoadmapFormValues>;
};

const GenerateRoadmapFromText = ({ register, errors }: Props) => {
	return (
		<div className="flex flex-col gap-2">
			<Label htmlFor="raw-text">Job Description</Label>
			<p className="text-muted-foreground text-xs">
				Paste the full job description below to generate a tailored learning
				roadmap.
			</p>
			<Textarea
				id="raw-text"
				placeholder="Paste job description here..."
				className="bg-muted/40 border-border/50 max-h-[140px] w-full resize-none overflow-auto"
				{...register('rawJobDescriptionText')}
			/>
			{errors.rawJobDescriptionText && (
				<p className="text-destructive text-xs">
					{errors.rawJobDescriptionText.message}
				</p>
			)}
		</div>
	);
};

export default GenerateRoadmapFromText;
