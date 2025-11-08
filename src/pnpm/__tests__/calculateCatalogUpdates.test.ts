import { describe, expect, it } from '@jest/globals';
import { calculateCatalogUpdates } from '../calculateCatalogUpdates.js';

describe('calculateCatalogUpdates', () => {
	it('treats the default catalog as an unnamed catalog', () => {
		expect(calculateCatalogUpdates({
			catalog: {
				typescript: '5.9.3',
			},
			packages: [],
		}, {
			importers: {
				'.': {
					devDependencies: {
						typescript: { specifier: 'catalog:' },
					},
				},
				'packages/test': {
					devDependencies: {
						typescript: { specifier: 'catalog:' },
					},
				},
			},
		})).toEqual({
			'typescript@5.9.3': [
				{ packageFile: 'package.json' },
				{ packageFile: 'packages/test/package.json' },
			],
		});
	});

	it('unifies catalogs with the same version of a package', () => {
		expect(calculateCatalogUpdates({
			catalogs: {
				typescript: { typescript: '5.9.3' },
				react: { typescript: '5.9.3' },
			},
			packages: [],
		}, {
			importers: {
				'.': {
					devDependencies: {
						typescript: { specifier: 'catalog:typescript' },
					},
				},
				'packages/test': {
					devDependencies: {
						typescript: { specifier: 'catalog:react' },
					},
				},
			},
		})).toEqual({
			'typescript@5.9.3': [
				{ packageFile: 'package.json' },
				{ packageFile: 'packages/test/package.json' },
			],
		});
	});

	it('respects catalogs with different versions of a package', () => {
		expect(calculateCatalogUpdates({
			catalogs: {
				typescript5: { typescript: '5.9.3' },
				typescript4: { typescript: '4.9.5' },
			},
			packages: [],
		}, {
			importers: {
				'.': {
					devDependencies: {
						typescript: { specifier: 'catalog:typescript5' },
					},
				},
				'packages/test': {
					devDependencies: {
						typescript: { specifier: 'catalog:typescript4' },
					},
				},
			},
		})).toEqual({
			'typescript@5.9.3': [
				{ packageFile: 'package.json' },
			],
			'typescript@4.9.5': [
				{ packageFile: 'packages/test/package.json' },
			],
		});
	});
});
