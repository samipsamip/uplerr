import type { FieldErrors, UseFormRegister } from 'react-hook-form';

import { Input } from '../ui/input';
import { Label } from '../ui/label';
import type { RoadmapFormValues } from './create-roadmap-modal';

type Props = {
	register: UseFormRegister<RoadmapFormValues>;
	errors: FieldErrors<RoadmapFormValues>;
};

const GenerateRoadmapFromURL = ({ register, errors }: Props) => {
	return (
		<div className="flex flex-col gap-2">
			<Label htmlFor="job-url">Job Listing URL</Label>
			<p className="text-muted-foreground text-xs">
				Paste a link to the job posting and we&apos;ll extract the description
				automatically.
			</p>
			<Input
				id="job-url"
				type="url"
				placeholder="https://..."
				className="bg-muted/40 border-border/50 w-full"
				{...register('jobDescriptionURL')}
			/>
			{errors.jobDescriptionURL && (
				<p className="text-destructive text-xs">
					{errors.jobDescriptionURL.message}
				</p>
			)}
		</div>
	);
};

export default GenerateRoadmapFromURL;
