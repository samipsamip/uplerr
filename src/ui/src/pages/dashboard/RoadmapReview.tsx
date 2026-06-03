import { Navigate, useLocation } from 'react-router';

import Layout from './Layout';

export default function RoadmapReview() {
	const location = useLocation();
	const content = (location.state as { content?: string } | null)?.content;

	if (!content) {
		return <Navigate to="/roadmaps" replace />;
	}

	return (
		<Layout>
			<div className="mx-auto max-w-3xl py-8">
				<h1 className="text-2xl font-semibold">Job Description Review</h1>
				<p className="text-muted-foreground mt-1 text-sm">
					Review the extracted job description before we generate your roadmap.
				</p>
				<pre className="bg-muted mt-6 whitespace-pre-wrap rounded-lg p-4 text-sm">
					{content}
				</pre>
			</div>
		</Layout>
	);
}
