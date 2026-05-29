import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ResumeStructuredData } from '@uppler/types';

import {
	getUserProfile,
	patchVerifyResume,
	postCreateProfileFromResume,
} from '@/network/profile.service';

export const useCreateProfileFromResume = () =>
	useMutation({
		mutationFn: postCreateProfileFromResume,
	});

export const useVerifyResume = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (structuredData?: ResumeStructuredData) =>
			patchVerifyResume(structuredData),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['userProfile'] });
		},
	});
};

export const useGetUserProfile = () =>
	useQuery({
		queryKey: ['userProfile'],
		queryFn: getUserProfile,
		retry: false,
		refetchOnWindowFocus: false,
	});
