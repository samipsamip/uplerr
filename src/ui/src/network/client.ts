import ky, { isHTTPError } from 'ky';

export const api = ky.create({
	baseUrl: import.meta.env.VITE_BASE_URL,
	credentials: 'include',
	hooks: {
		beforeError: [
			({ error }) => {
				if (isHTTPError(error)) {
					if (
						typeof error.data === 'object' &&
						error.data !== null &&
						'message' in error.data
					) {
						error.name = 'HTTPError';
						error.message = `${String(error.data.message)}`;
					}
				}
				return error;
			},
		],
	},
});
