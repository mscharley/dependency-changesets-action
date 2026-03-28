import { describe, expect, it } from '@jest/globals';
import { isPnpmWorkspace } from '../model/PnpmWorkspace.js';
import { parse as parseYaml } from 'yaml';

describe('isPnpmWorkspace', () => {
	it('accepts a workspace with packages and catalogs', () => {
		const data: unknown = parseYaml(`
packages:
  - packages/*
catalogs:
  lint:
    eslint: ^9.39.2
`);
		expect(isPnpmWorkspace(data)).toBe(true);
	});

	it('accepts a workspace with only catalogs and no packages field', () => {
		const data: unknown = parseYaml(`
catalogs:
  lint:
    '@eslint/js': ^9.39.2
    eslint: ^9.39.2
    prettier: ^3.7.4
`);
		expect(isPnpmWorkspace(data)).toBe(true);
	});

	it('accepts a workspace with only packages', () => {
		const data: unknown = parseYaml(`
packages:
  - packages/*
`);
		expect(isPnpmWorkspace(data)).toBe(true);
	});

	it('accepts a workspace with a default catalog', () => {
		const data: unknown = parseYaml(`
packages:
  - packages/*
catalog:
  react: ^18.0.0
`);
		expect(isPnpmWorkspace(data)).toBe(true);
	});

	it('accepts a workspace with numeric version values from YAML parsing', () => {
		const data: unknown = parseYaml(`
catalogs:
  test:
    some-pkg: 2
    another-pkg: 3.0
`);
		expect(isPnpmWorkspace(data)).toBe(true);
	});
});
