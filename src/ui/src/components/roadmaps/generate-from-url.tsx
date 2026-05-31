import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';

const GenerateRoadmapFromURL = () => {
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
			/>
			<Label htmlFor="job-description-extracted">
				Extracted Job Description
			</Label>
			<Textarea id="job-description-extracted" disabled />
		</div>
	);
};

export default GenerateRoadmapFromURL;
