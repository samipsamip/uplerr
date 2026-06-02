// Dialog

import { useForm } from 'react-hook-form';
import { Button } from '../ui/button';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogOverlay,
	DialogTitle,
} from '../ui/dialog';
import CreateRoadmapTabs from './create-roadmaps-tab';

type CreateRoadMapModalProps = {
	open: boolean;
	setOpen: (open: boolean) => void;
};
export default function CreateRoadMapModal({
	open,
	setOpen,
}: CreateRoadMapModalProps) {
	return (
		<Dialog open={open} onOpenChange={setOpen} modal>
			<DialogOverlay>
				<DialogContent className="sm:max-w-2xl">
					<DialogHeader>
						<DialogTitle>Generate Your Learning Roadmap</DialogTitle>
						<DialogDescription>
							Paste a job description or job link to turn it into a step-by-step
							roadmap.
						</DialogDescription>
					</DialogHeader>
					<CreateRoadmapTabs />
					<Button>Generate me a Roadmap</Button>
				</DialogContent>
			</DialogOverlay>
		</Dialog>
	);
}
