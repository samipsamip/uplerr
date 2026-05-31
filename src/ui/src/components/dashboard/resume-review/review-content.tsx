import { useState } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, CheckCircle2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import type { CvStructuredData } from '@uppler/types';

import { Button } from '@/components/ui/button';
import type { SkillMatchMeta } from '@/network/profile.service';
import { useVerifyResume } from '@/query/profile.query';

import { AiSidebar } from './ai-sidebar';
import { ReviewEducationSection } from './review-education-section';
import { ReviewExperienceSection } from './review-experience-section';
import { ReviewProfileSection } from './review-profile-section';
import { ReviewProjectsSection } from './review-projects-section';
import { ReviewSkillsSection } from './review-skills-section';

function SectionLabel({ children }: { children: React.ReactNode }) {
	return (
		<p className="text-muted-foreground/50 mb-5 text-[11px] font-semibold uppercase tracking-[0.08em]">
			{children}
		</p>
	);
}

interface ReviewContentProps {
	initial: CvStructuredData;
	skillMatchMeta?: SkillMatchMeta;
}

export function ReviewContent({ initial, skillMatchMeta }: ReviewContentProps) {
	const navigate = useNavigate();
	const { mutateAsync, isPending } = useVerifyResume();
	const [data, setData] = useState<CvStructuredData>(initial);

	const setExtraction = <K extends keyof CvStructuredData['extraction']>(
		key: K,
		value: CvStructuredData['extraction'][K],
	) =>
		setData((prev) => ({
			...prev,
			extraction: { ...prev.extraction, [key]: value },
		}));

	const isDirty = JSON.stringify(data) !== JSON.stringify(initial);

	const onConfirm = async () => {
		try {
			await mutateAsync(isDirty ? data : undefined);
			toast.success('CV verified - your profile is ready');
			navigate('/skills', { replace: true });
		} catch {
			toast.error('Could not save - please try again');
		}
	};

	return (
		<div className="flex flex-1 flex-col overflow-hidden">
			{/* Sticky header */}
			<div className="border-border/40 bg-background/95 supports-[backdrop-filter]:bg-background/80 sticky top-0 z-10 shrink-0 border-b backdrop-blur-sm">
				<div className="relative flex items-center px-6 py-3 md:px-8">
					<button
						type="button"
						onClick={() => navigate('/skills', { replace: true })}
						className="text-muted-foreground hover:text-foreground flex items-center gap-1.5 text-sm transition-colors"
					>
						<ArrowLeft className="size-4" />
						Back
					</button>

					<span className="pointer-events-none absolute inset-x-0 text-center text-sm font-medium">
						Review your CV
					</span>

					<div className="ml-auto">
						<Button
							onClick={onConfirm}
							disabled={isPending}
							size="sm"
							className="gap-1.5"
						>
							{isPending ? (
								<Loader2 className="size-3.5 animate-spin" />
							) : (
								<CheckCircle2 className="size-3.5" />
							)}
							{isDirty ? 'Save & confirm' : 'Looks good'}
						</Button>
					</div>
				</div>
			</div>

			{/* Body: single column on mobile, two-column on md+ */}
			<div className="flex flex-1 flex-col overflow-y-auto md:flex-row md:overflow-hidden">
				{/* Main content */}
				<div className="min-w-0 flex-1 px-4 py-6 md:flex-[3] md:overflow-auto md:px-10 md:py-8">
					<section className="mb-10">
						<ReviewProfileSection
							data={{
								full_name: data.extraction.full_name,
								contact_details: data.extraction.contact_details,
							}}
							onChange={(updated) =>
								setData((prev) => ({
									...prev,
									extraction: { ...prev.extraction, ...updated },
								}))
							}
						/>
					</section>

					<section className="mb-10">
						<SectionLabel>Experience</SectionLabel>
						<ReviewExperienceSection
							experience={data.extraction.work_history}
							onChange={(wh) => setExtraction('work_history', wh)}
						/>
					</section>

					<section className="mb-10">
						<SectionLabel>
							Projects
							{data.projects.projects.length > 0
								? ` · ${data.projects.projects.length} extracted`
								: ''}
						</SectionLabel>
						<ReviewProjectsSection
							projects={data.projects}
							onChange={(projects) =>
								setData((prev) => ({ ...prev, projects }))
							}
						/>
					</section>

					<section className="mb-10">
						<SectionLabel>
							Skills
							{(() => {
								const total = [
									...data.skills.technical_skills,
									...data.skills.tools_platforms,
									...data.skills.spoken_languages,
									...data.skills.soft_skills,
								].length;
								return total > 0 ? ` · ${total} extracted` : '';
							})()}
						</SectionLabel>
						<ReviewSkillsSection
							skills={data.skills}
							onChange={(skills) => setData((prev) => ({ ...prev, skills }))}
						/>
					</section>

					<section className="mb-10">
						<SectionLabel>Education</SectionLabel>
						<ReviewEducationSection
							education={data.extraction.education}
							onChange={(edu) => setExtraction('education', edu)}
						/>
					</section>

					<div className="h-16" />
				</div>

				{/* Sidebar — full width below content on mobile, right column on md+ */}
				<div className="border-border/40 border-t md:flex-1 md:overflow-hidden md:border-l md:border-t-0">
					<AiSidebar data={data} skillMatchMeta={skillMatchMeta} />
				</div>
			</div>
		</div>
	);
}
