import { describe, expect, it } from '@jest/globals';
import { isPnpmLock } from '../model/PnpmLock.js';
import { parseAllDocuments } from 'yaml';

const parseYaml = (input: string): unknown =>
	parseAllDocuments(input).pop()?.toJSON();

describe('isPnpmLock', () => {
	it('accepts a single-document lockfile', () => {
		const data = parseYaml(`
lockfileVersion: '9.0'
settings:
  autoInstallPeers: true
importers:
  .:
    dependencies:
      react:
        specifier: ^18.0.0
        version: 18.2.0
`);
		expect(isPnpmLock(data)).toBe(true);
		expect((data as Record<string, unknown>).lockfileVersion).toBe('9.0');
	});

	it('accepts a multi-document lockfile with configDependencies', () => {
		const data = parseYaml(`---
lockfileVersion: '9.0'
settings:
  autoInstallPeers: true
configDependencies:
  '@company/config': 1.0.0
---
lockfileVersion: '9.0'
importers:
  .:
    dependencies:
      react:
        specifier: ^18.0.0
        version: 18.2.0
    devDependencies:
      typescript:
        specifier: ^5.0.0
        version: 5.4.5
`);
		expect(isPnpmLock(data)).toBe(true);
		expect((data as Record<string, unknown>).lockfileVersion).toBe('9.0');
		expect((data as Record<string, unknown>).importers).toBeDefined();
		expect((data as Record<string, unknown>).configDependencies).toBeUndefined();
	});

	it('accepts a lockfile with no importers', () => {
		const data = parseYaml(`
lockfileVersion: '9.0'
`);
		expect(isPnpmLock(data)).toBe(true);
	});

	it('rejects a non-object', () => {
		expect(isPnpmLock('hello')).toBe(false);
		expect(isPnpmLock(null)).toBe(false);
		expect(isPnpmLock(42)).toBe(false);
	});
});
