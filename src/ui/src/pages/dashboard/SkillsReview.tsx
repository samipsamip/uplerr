import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router';
import { ArrowLeft, CheckCircle2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import type { ResumeStructuredData } from '@uppler/types';

import { ReviewEducationSection } from '@/components/dashboard/resume-review/review-education-section';
import { ReviewExperienceSection } from '@/components/dashboard/resume-review/review-experience-section';
import { ReviewProfileSection } from '@/components/dashboard/resume-review/review-profile-section';
import { ReviewSkillsSection } from '@/components/dashboard/resume-review/review-skills-section';
import { TopBar } from '@/components/dashboard/top-bar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useVerifyResume } from '@/query/profile.query';

import Layout from './Layout';

function SectionHeading({ children }: { children: React.ReactNode }) {
	return (
		<p className="text-muted-foreground mb-3 text-xs font-medium uppercase tracking-wider">
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

	return (
		<>
			<TopBar
				title="Review extracted data"
				description="Check what we pulled from your CV. Edit anything that looks off, then confirm."
			/>

			<div className="flex flex-col gap-6 p-6 pb-28 md:p-8 md:pb-28">
				<Card className="border-border/60 rounded-xl border shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
					<CardContent className="p-5">
						<SectionHeading>Profile</SectionHeading>
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
					</CardContent>
				</Card>

				<Card className="border-border/60 rounded-xl border shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
					<CardContent className="p-5">
						<SectionHeading>Skills ({data.skills.length})</SectionHeading>
						<ReviewSkillsSection
							skills={data.skills}
							onChange={(skills) => set('skills', skills)}
						/>
					</CardContent>
				</Card>

				{data.experience.length > 0 && (
					<Card className="border-border/60 rounded-xl border shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
						<CardContent className="p-5">
							<SectionHeading>Experience</SectionHeading>
							<ReviewExperienceSection
								experience={data.experience}
								onChange={(exp) => set('experience', exp)}
							/>
						</CardContent>
					</Card>
				)}

				<Card className="border-border/60 rounded-xl border shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
					<CardContent className="p-5">
						<SectionHeading>Education</SectionHeading>
						<ReviewEducationSection
							education={data.education}
							onChange={(edu) => set('education', edu)}
						/>
					</CardContent>
				</Card>
			</div>

			<div className="border-border/60 bg-background/95 supports-[backdrop-filter]:bg-background/80 fixed bottom-0 left-0 right-0 z-10 flex items-center justify-between border-t px-6 py-4 backdrop-blur-sm md:px-8">
				<button
					type="button"
					onClick={() => navigate('/skills', { replace: true })}
					className="text-muted-foreground hover:text-foreground flex items-center gap-1.5 text-sm transition-colors"
				>
					<ArrowLeft className="size-4" />
					Back to skills
				</button>

				<Button onClick={onConfirm} disabled={isPending} className="gap-2">
					{isPending ? (
						<Loader2 className="size-4 animate-spin" />
					) : (
						<CheckCircle2 className="size-4" />
					)}
					{isDirty ? 'Save changes & confirm' : 'Looks good, confirm'}
				</Button>
			</div>
		</>
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
