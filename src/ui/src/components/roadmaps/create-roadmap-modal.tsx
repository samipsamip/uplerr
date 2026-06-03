import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useMutation, useQuery } from '@tanstack/react-query';

import {
	getScrapingJobStatus,
	type JobState,
	postStartScraping,
} from '@/network/scraper.service';

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

export type RoadmapFormValues = {
	jobDescriptionURL: string;
	rawJobDescriptionText: string;
};

const STAGE_LABELS: Record<string, string> = {
	validating: 'Validating URL...',
	'checking-cache': 'Checking cache...',
	fetching: 'Fetching job page...',
	extracting: 'Extracting job details...',
	'deep-loading': 'Loading page content...',
};

function getStageLabel(jobStatus: JobState | undefined): string {
	if (!jobStatus || jobStatus.status === 'pending') return 'Getting ready...';
	if (jobStatus.status === 'processing') {
		return STAGE_LABELS[jobStatus.stage] ?? 'Processing...';
	}
	return 'Processing...';
}

type CreateRoadMapModalProps = {
	open: boolean;
	setOpen: (open: boolean) => void;
};

export default function CreateRoadMapModal({
	open,
	setOpen,
}: CreateRoadMapModalProps) {
	const navigate = useNavigate();
	const [activeTab, setActiveTab] = useState<'url' | 'text'>('url');
	const [jobId, setJobId] = useState<string | null>(null);

	const form = useForm<RoadmapFormValues>({
		defaultValues: { jobDescriptionURL: '', rawJobDescriptionText: '' },
	});

	const startMutation = useMutation({
		mutationFn: postStartScraping,
		onSuccess: ({ jobId }) => setJobId(jobId),
		onError: (err: Error) => {
			toast.error(err.message || 'Failed to start. Please try again.');
		},
	});

	const { data: jobStatus } = useQuery({
		queryKey: ['scraper-job', jobId],
		queryFn: () => getScrapingJobStatus(jobId!),
		enabled: !!jobId,
		refetchInterval: (query) => {
			const status = query.state.data?.status;
			if (status === 'done' || status === 'error') return false;
			return 1000;
		},
	});

	useEffect(() => {
		if (!jobStatus) return;

		if (jobStatus.status === 'done') {
			void navigate('/roadmaps/review', {
				state: { content: jobStatus.content },
			});
		}

		if (jobStatus.status === 'error') {
			toast.error(
				jobStatus.message || 'Something went wrong. Please try again.',
			);
			setJobId(null);
		}
	}, [jobStatus, navigate]);

	const handleTabChange = (tab: 'url' | 'text') => {
		setActiveTab(tab);
		form.clearErrors();
		if (tab === 'url') form.setValue('rawJobDescriptionText', '');
		else form.setValue('jobDescriptionURL', '');
	};

	const onSubmit = form.handleSubmit((values) => {
		if (activeTab === 'url') {
			if (!values.jobDescriptionURL) {
				form.setError('jobDescriptionURL', {
					message: 'Please enter a job URL.',
				});
				return;
			}
			startMutation.mutate({
				hasUrl: true,
				jobDescriptionURL: values.jobDescriptionURL,
			});
		} else {
			if (!values.rawJobDescriptionText) {
				form.setError('rawJobDescriptionText', {
					message: 'Please paste a job description.',
				});
				return;
			}
			startMutation.mutate({
				hasUrl: false,
				rawJobDescriptionText: values.rawJobDescriptionText,
			});
		}
	});

	const isProcessing =
		startMutation.isPending ||
		(!!jobId && jobStatus?.status !== 'done' && jobStatus?.status !== 'error');

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
					<form onSubmit={onSubmit}>
						<div className="relative">
							{isProcessing && (
								<div className="bg-background/80 absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 rounded-lg backdrop-blur-sm">
									<Loader2 className="text-primary h-6 w-6 animate-spin" />
									<p className="text-muted-foreground text-sm">
										{getStageLabel(jobStatus)}
									</p>
								</div>
							)}
							<CreateRoadmapTabs
								activeTab={activeTab}
								onTabChange={handleTabChange}
								register={form.register}
								errors={form.formState.errors}
							/>
							<Button
								type="submit"
								disabled={isProcessing}
								className="mt-4 w-full"
							>
								{isProcessing ? (
									<>
										<Loader2 className="mr-2 h-4 w-4 animate-spin" />
										{getStageLabel(jobStatus)}
									</>
								) : (
									'Generate me a Roadmap'
								)}
							</Button>
						</div>
					</form>
				</DialogContent>
			</DialogOverlay>
		</Dialog>
	);
}
