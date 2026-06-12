import ky, { isHTTPError } from 'ky';

export const api = ky.create({
	prefix: import.meta.env.VITE_API_URL ?? 'http://localhost:3000',
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
