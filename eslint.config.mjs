import { configs, disableTypeCheckedRules, withStyles } from '@mscharley/eslint-config';

export default [
	...configs.recommended,
	...configs.node,
	...withStyles(),
	disableTypeCheckedRules('*.config.mjs'),
	{
		ignores: [
			'!.*',
			'**/node_modules/.*',
			'**/dist/.*',
			'**/coverage/.*',
			'*.json',
			'lib/',
			'dist/',
			'node_modules/',
			'coverage/',
		],
	},
	{
		rules: {
			'camelcase': 'off',
			'no-console': 'off',
		},
	},
];
