import { Navigate, useLocation } from 'react-router';
import type { CvStructuredData } from '@uppler/types';

import { ReviewContent } from '@/components/dashboard/resume-review/review-content';
import type { SkillMatchMeta } from '@/network/profile.service';

import Layout from './Layout';

export default function SkillsReview() {
	const location = useLocation();
	const structuredData = location.state?.structuredData as
		| CvStructuredData
		| undefined;
	const skillMatchMeta = location.state?.skillMatchMeta as
		| SkillMatchMeta
		| undefined;

	if (!structuredData) {
		return <Navigate to="/skills" replace />;
	}

	return (
		<Layout>
			<ReviewContent initial={structuredData} skillMatchMeta={skillMatchMeta} />
		</Layout>
	);
}
