import { useEffect } from 'react';
import { DateTime, Interval } from 'luxon';
import { toast } from 'sonner';

import { Card, CardContent } from '@/components/ui/card';
import { Fallback } from '@/components/ui/fallback';
import ErrorPage from '@/pages/ErrorPage';
import { useGetUserProfile } from '@/query/profile.query';

import { TopBar } from '../top-bar';
import { CvCard } from './cv-card';
import { CvEmptyState } from './cv-empty-state';
import { SkillsList } from './skills-list';

const formatUploadedDateToHuman = (date?: string) => {
	if (!date) return;
	const now = DateTime.now().toUTC();
	const uploadDate = DateTime.fromISO(date);

	const interval = Interval.fromDateTimes(uploadDate, now);

	const duration = interval.toDuration(['days']);

	if (duration.as('days') < 1) {
		return 'less than 1 day ago';
	}

	return `${duration.toHuman()} ago`;
};

export default function SkillsMain() {
	const { data: skillData, isLoading, isError } = useGetUserProfile();

	useEffect(() => {
		if (isError) toast.error('Error loading the profile page');
	}, [isError]);

	if (isLoading) return <Fallback />;
	if (isError) return <ErrorPage />;

	const cvFile = skillData?.cv
		? {
				name: skillData.cv.filename,
				uploadedAt: formatUploadedDateToHuman(skillData.cv.uploadedAt) || '',
				is_verified: skillData.cv.is_verified,
				structuredData: skillData.cv.structuredData,
			}
		: undefined;

	return (
		<>
			<TopBar
				title="Skills & CV"
				description="Your extracted skills power every roadmap we generate for you."
			/>

			<div className="flex flex-col gap-8 p-6 md:p-8">
				<Card className="border-border/60 rounded-xl border shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
					<CardContent className="p-5">
						{cvFile ? <CvCard cvFile={cvFile} /> : <CvEmptyState />}
					</CardContent>
				</Card>

				<SkillsList />
			</div>
		</>
	);
}
