import { toast } from 'sonner';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
	addSubtopicResource,
	deleteRoadmap,
	getRoadmap,
	getRoadmaps,
	patchRoadmapStatus,
} from '@/network/roadmaps.service';

export const ROADMAPS_KEY = ['roadmaps'] as const;
export const roadmapKey = (id: string) => ['roadmaps', id] as const;

export const useGetRoadmaps = () =>
	useQuery({
		queryKey: ROADMAPS_KEY,
		queryFn: getRoadmaps,
		retry: false,
		refetchOnWindowFocus: false,
	});

export const useGetRoadmap = (planId: string) =>
	useQuery({
		queryKey: roadmapKey(planId),
		queryFn: () => getRoadmap(planId),
		retry: false,
		refetchOnWindowFocus: false,
	});

export const useUpdateRoadmapStatus = (planId: string) => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (status: 'active' | 'completed' | 'archived') =>
			patchRoadmapStatus(planId, status),
		onSuccess: () => {
			void qc.invalidateQueries({ queryKey: ROADMAPS_KEY });
			void qc.invalidateQueries({ queryKey: roadmapKey(planId) });
		},
		onError: () => toast.error('Failed to update status. Please try again.'),
	});
};

export const useDeleteRoadmap = () => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: deleteRoadmap,
		onSuccess: () => {
			void qc.invalidateQueries({ queryKey: ROADMAPS_KEY });
			toast.success('Roadmap deleted.');
		},
		onError: () => toast.error('Failed to delete roadmap. Please try again.'),
	});
};

export const useAddSubtopicResource = (planId: string) => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (payload: {
			topic_order: number;
			subtopic_title: string;
			resource: { title: string; url: string };
		}) => addSubtopicResource(planId, payload),
		onSuccess: () => {
			void qc.invalidateQueries({ queryKey: roadmapKey(planId) });
			toast.success('Resource added.');
		},
		onError: () => toast.error('Failed to add resource. Please try again.'),
	});
};
