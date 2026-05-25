import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		coverage: {
			provider: 'v8',
			enabled: true,
			include: ['src/**/*.{ts,tsx}'],
			exclude: [
				'src/tests/**',
				'src/index.ts',
				'src/app.ts',
				'src/schemas/**',
				'src/utils/db.ts',
				'src/utils/constants.ts',
				'src/utils/email_utils.ts',
				'src/lib/auth.ts',
				'src/lib/upload-utils.ts',
				'src/lib/middleware.ts',
			],
			thresholds: {
				lines: 80,
				branches: 80,
				functions: 80,
				statements: 80,
			},
			reporter: ['text', 'html'],
		},
	},
});
