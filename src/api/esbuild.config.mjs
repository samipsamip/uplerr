import { build } from 'esbuild';
import { readFileSync } from 'node:fs';

const pkg = JSON.parse(readFileSync('./package.json', 'utf8'));

// Keep npm packages external, but bundle workspace packages (they ship raw TS)
const external = Object.entries(pkg.dependencies)
	.filter(([, version]) => !version.startsWith('workspace:'))
	.map(([name]) => name);

await build({
	entryPoints: ['src/index.ts', 'src/migrate.ts'],
	bundle: true,
	platform: 'node',
	format: 'esm',
	external,
	outbase: 'src',
	outdir: 'dist',
});
