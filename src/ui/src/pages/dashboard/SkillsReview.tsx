import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router';
import { ArrowLeft, CheckCircle2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import type { ResumeStructuredData } from '@uppler/types';

import { ReviewEducationSection } from '@/components/dashboard/resume-review/review-education-section';
import { ReviewExperienceSection } from '@/components/dashboard/resume-review/review-experience-section';
import { ReviewProfileSection } from '@/components/dashboard/resume-review/review-profile-section';
import { ReviewSkillsSection } from '@/components/dashboard/resume-review/review-skills-section';
import { Button } from '@/components/ui/button';
import { useVerifyResume } from '@/query/profile.query';

import Layout from './Layout';

function SectionLabel({ children }: { children: React.ReactNode }) {
	return (
		<p className="text-muted-foreground/60 mb-4 text-[11px] font-semibold uppercase tracking-[0.08em]">
			{children}
		</p>
	);
}

function ReviewContent({ initial }: { initial: ResumeStructuredData }) {
	const navigate = useNavigate();
	const { mutateAsync, isPending } = useVerifyResume();
	const [data, setData] = useState<ResumeStructuredData>(initial);

	const set = <K extends keyof ResumeStructuredData>(
		key: K,
		value: ResumeStructuredData[K],
	) => setData((prev) => ({ ...prev, [key]: value }));

	const isDirty = JSON.stringify(data) !== JSON.stringify(initial);

	const onConfirm = async () => {
		try {
			await mutateAsync(isDirty ? data : undefined);
			toast.success('CV verified — your profile is ready');
			navigate('/skills', { replace: true });
		} catch {
			toast.error('Could not save — please try again');
		}
	};

	const summary = [
		data.skills.length > 0 && `${data.skills.length} skills`,
		data.experience.length > 0 &&
			`${data.experience.length} ${data.experience.length === 1 ? 'role' : 'roles'}`,
		data.education.length > 0 &&
			`${data.education.length} ${data.education.length === 1 ? 'qualification' : 'qualifications'}`,
	]
		.filter(Boolean)
		.join(' · ');

	return (
		<div className="flex flex-1 flex-col">
			{/* Sticky header with page title centred */}
			<div className="bg-background/95 supports-[backdrop-filter]:bg-background/80 border-border/40 sticky top-0 z-10 shrink-0 border-b backdrop-blur-sm">
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

			{/* Scrollable content */}
			<div className="flex-1 overflow-auto">
				<div className="mx-auto max-w-2xl px-6 py-8 md:px-8">
					{/* Summary line */}
					{summary && (
						<p className="text-muted-foreground/60 mb-8 text-xs">
							AI extracted: {summary}. Edit anything that looks off, then
							confirm.
						</p>
					)}

					{/* Profile */}
					<section>
						<SectionLabel>Profile</SectionLabel>
						<ReviewProfileSection
							data={{
								name: data.name,
								email: data.email,
								phone: data.phone,
								location: data.location,
								links: data.links,
							}}
							onChange={(updated) =>
								setData((prev) => ({ ...prev, ...updated }))
							}
						/>
					</section>

					<div className="my-10" />

					{/* Skills */}
					<section>
						<SectionLabel>
							Skills{data.skills.length > 0 && ` · ${data.skills.length}`}
						</SectionLabel>
						<ReviewSkillsSection
							skills={data.skills}
							onChange={(skills) => set('skills', skills)}
						/>
					</section>

					<div className="my-10" />

					{/* Experience */}
					<section>
						<SectionLabel>Experience</SectionLabel>
						<ReviewExperienceSection
							experience={data.experience}
							onChange={(exp) => set('experience', exp)}
						/>
					</section>

					<div className="my-10" />

					{/* Education */}
					<section>
						<SectionLabel>Education</SectionLabel>
						<ReviewEducationSection
							education={data.education}
							onChange={(edu) => set('education', edu)}
						/>
					</section>

					<div className="h-16" />
				</div>
			</div>
		</div>
	);
}

export default function SkillsReview() {
	const location = useLocation();
	const structuredData = location.state?.structuredData as
		| ResumeStructuredData
		| undefined;

	if (!structuredData) {
		return <Navigate to="/skills" replace />;
	}

	return (
		<Layout>
			<ReviewContent initial={structuredData} />
		</Layout>
	);
}
