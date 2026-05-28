import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ResumeStructuredData } from '@uppler/types';

import {
	getUserProfile,
	patchVerifyResume,
	postCreateProfileFromResume,
	postUpdateResume,
} from '@/network/profile.service';

export const useUpdateResume = () =>
	useMutation({
		mutationFn: async (formData: FormData) => await postUpdateResume(formData),
	});

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
