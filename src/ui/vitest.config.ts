import path from 'node:path';
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
	plugins: [react()],
	test: {
		environment: 'jsdom',
		globals: true,
		setupFiles: ['./tests/setup.ts'],
		env: {
			VITE_BASE_URL: 'http://localhost:3000',
		},
		coverage: {
			provider: 'v8',
			enabled: true,
			include: ['src/**/*.{ts,tsx}'],
			exclude: [
				'src/components/ui/**',
				'src/main.tsx',
				'src/lib/routes.tsx',
				'src/lib/utils.ts',
				'src/lib/constants.ts',
				'src/auth-client.ts',
				'src/network/client.ts',
				'src/pages/PdfDebugPage.tsx',
			],
			reporter: ['text', 'html'],
		},
	},
	resolve: {
		alias: {
			'@': path.resolve(__dirname, './src'),
			'@uppler/types': path.resolve(__dirname, '../types/src/index.ts'),
		},
	},
});
