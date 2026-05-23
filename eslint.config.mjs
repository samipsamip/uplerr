import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactPlugin from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import importPlugin from 'eslint-plugin-import';
import prettierConfig from 'eslint-config-prettier';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default tseslint.config(
	{
		ignores: [
			'**/dist/**',
			'**/node_modules/**',
			'src/ui/src/components/ui/**',
		],
	},
	js.configs.recommended,
	...tseslint.configs.recommended,
	// Import sorting — all files
	{
		plugins: { 'simple-import-sort': simpleImportSort },
		rules: {
			'simple-import-sort/imports': [
				'error',
				{
					groups: [
						['^\\u0000'],
						['^react', '^\\w', '^@(?!/)'],
						['^@/'],
						['^\\.\\.', '^\\.'],
					],
				},
			],
			'simple-import-sort/exports': 'error',
		},
	},
	// Import dependency rules — all files
	{
		plugins: { import: importPlugin },
		settings: {
			'import/resolver': {
				typescript: {
					alwaysTryTypes: true,
					project: [
						'src/api/tsconfig.json',
						'src/ui/tsconfig.json',
					],
				},
			},
		},
		rules: {
			'import/no-cycle': 'error',
		},
	},
	// Extraneous deps — scoped per package so each is checked against its own package.json
	{
		files: ['src/api/**'],
		rules: {
			'import/no-extraneous-dependencies': [
				'error',
				{ packageDir: [resolve(__dirname, 'src/api')] },
			],
		},
	},
	{
		files: ['src/ui/**'],
		rules: {
			'import/no-extraneous-dependencies': [
				'error',
				{ packageDir: [resolve(__dirname, 'src/ui')] },
			],
		},
	},
	// General rules — all TS/JS files
	{
		rules: {
			'no-console': 'warn',
			'no-nested-ternary': 'warn',
			'@typescript-eslint/naming-convention': [
				'error',
				{
					selector: 'variable',
					format: ['camelCase', 'PascalCase', 'UPPER_CASE'],
					leadingUnderscore: 'allow',
				},
				{
					selector: 'function',
					format: ['camelCase', 'PascalCase'],
				},
				{
					selector: 'typeLike',
					format: ['PascalCase'],
				},
			],
		},
	},
	// React rules — UI package only
	{
		files: ['src/ui/src/**/*.{ts,tsx}'],
		plugins: {
			react: reactPlugin,
			'react-hooks': reactHooks,
		},
		rules: {
			'react/jsx-uses-react': 'error',
			'react/jsx-uses-vars': 'error',
			'react/react-in-jsx-scope': 'off',
			'react/require-default-props': 'off',
			'react-hooks/rules-of-hooks': 'error',
			'react-hooks/exhaustive-deps': 'warn',
			'react/button-has-type': 'error',
			'react/no-danger': 'error',
			'react/no-unused-prop-types': 'error',
			'react/self-closing-comp': 'error',
			'react/no-array-index-key': 'warn',
			'react/jsx-no-useless-fragment': 'warn',
			'react/no-unstable-nested-components': 'warn',
		},
		settings: {
			react: { version: 'detect' },
		},
	},
	prettierConfig,
);
