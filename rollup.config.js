import commonjs from '@rollup/plugin-commonjs';
import license from 'rollup-plugin-license';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';

export default {
	input: 'src/index.ts',
	output: {
		file: 'dist/index.js',
		format: 'esm',
		sourcemap: true,
	},
	treeshake: {
		preset: 'recommended',
	},
	plugins: [
		nodeResolve({
			exportConditions: ['node'],
			preferBuiltins: true,
		}),
		commonjs(),
		typescript(),
		license({
			thirdParty: {
				output: {
					file: 'dist/licenses.txt',
				},
			},
		}),
	],
};
