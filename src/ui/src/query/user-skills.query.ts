import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
	type AddSkillPayload,
	deleteSkill,
	getUserSkills,
	postAddSkill,
	putUpdateSkill,
	type UpdateSkillPayload,
} from '@/network/user-skills.service';

const SKILLS_KEY = ['userSkills'] as const;

export const useGetUserSkills = () =>
	useQuery({
		queryKey: SKILLS_KEY,
		queryFn: getUserSkills,
		retry: false,
		refetchOnWindowFocus: false,
	});

export const useAddSkill = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (payload: AddSkillPayload) => postAddSkill(payload),
		onSuccess: () => queryClient.invalidateQueries({ queryKey: SKILLS_KEY }),
	});
};

export const useUpdateSkill = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({
			skillId,
			payload,
		}: {
			skillId: string;
			payload: UpdateSkillPayload;
		}) => putUpdateSkill(skillId, payload),
		onSuccess: () => queryClient.invalidateQueries({ queryKey: SKILLS_KEY }),
	});
};

export const useDeleteSkill = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (skillId: string) => deleteSkill(skillId),
		onSuccess: () => queryClient.invalidateQueries({ queryKey: SKILLS_KEY }),
	});
};
