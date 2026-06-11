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
				'src/lib/auth.ts',
				'src/lib/logger.ts',
				'src/utils/constants.ts',
				'src/seed/**',
				'src/scripts/**',
				'src/components/admin/**',
				'src/components/waitlist/**',
			],
			thresholds: {
				lines: 80,
				branches: 70,
				functions: 80,
				statements: 80,
			},
			reporter: ['text', 'html'],
		},
	},
});
