import commonjs from '@rollup/plugin-commonjs';
import license from 'rollup-plugin-license';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';

export default {
	input: 'src/index.ts',
	output: {
		file: 'dist/index.cjs',
		format: 'cjs',
		sourcemap: true,
	},
	treeshake: true,
	plugins: [
		commonjs(),
		nodeResolve({
			exportConditions: ['node'],
			preferBuiltins: true,
		}),
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
