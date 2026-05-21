import { useOutletContext } from 'react-router';

interface MeResponse {
	createdAt: string;
	email: string;
	emailVerified: boolean;
	id: string;
	image: string | null;
	name: string;
	updatedAt: string;
}
export default function useAuthUser() {
	return useOutletContext<MeResponse>();
}
