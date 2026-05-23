import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
	getUserProfile,
	postCreateProfileFromResume,
	postUpdateResume,
} from '@/network/skills.service';

export const useUpdateResume = () =>
	useMutation({
		mutationFn: async (formData: FormData) => await postUpdateResume(formData),
	});

export const useCreateProfileFromResume = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: postCreateProfileFromResume,
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
