import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';

const GenerateRoadmapFromText = () => {
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
				className="bg-muted/40 border-border/50 min-h-[140px] w-full resize-none"
			/>
		</div>
	);
};

export default GenerateRoadmapFromText;
