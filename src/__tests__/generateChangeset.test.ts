import { describe, expect, it, jest } from '@jest/globals';

jest.unstable_mockModule('@actions/core', () => ({ info: (): void => {}, debug: (): void => {} }));

const { changesets, commit, input, pr } = await import('./test-utils.js');
const { generateChangeset } = await import('../generateChangeset.js');

describe('generateChangeset', () => {
	describe('conventional commits', () => {
		it('will return a patch if conventional commits is disabled', () => {
			expect(
				generateChangeset(
					pr({}),
					commit({ commit: { message: 'chore: hello, world' } }),
					input({ useConventionalCommits: false }),
					changesets({}),
					{ foundChangeset: false },
					[['package.json', { name: '@mscharley/test' }]],
				),
			).toMatchObject({
				affectedPackages: ['@mscharley/test'],
				message: 'chore: hello, world',
				updateType: 'patch',
			});
		});

		it('will return no changeset for no update', () => {
			expect(
				generateChangeset(
					pr({}),
					commit({ commit: { message: 'chore: hello, world' } }),
					input({ useConventionalCommits: true }),
					changesets({}),
					{ foundChangeset: false },
					[['package.json', { name: '@mscharley/test' }]],
				),
			).toBeNull();
		});
	});

	it('will return no changeset if there are no affected packages', () => {
		expect(
			generateChangeset(
				pr({}),
				commit({ commit: { message: 'fix: hello, world' } }),
				input({ useConventionalCommits: true }),
				changesets({}),
				{ foundChangeset: false },
				[],
			),
		).toBeNull();
	});

	it('will return no changeset if there is already one detected', () => {
		expect(
			generateChangeset(
				pr({}),
				commit({ commit: { message: 'fix: hello, world' } }),
				input({ useConventionalCommits: true }),
				changesets({}),
				{ foundChangeset: true },
				[['package.json', { name: '@mscharley/test' }]],
			),
		).toBeNull();
	});

	it('will exclude a package if it is detected as a workspace metapackage', () => {
		expect(
			generateChangeset(
				pr({}),
				commit({ commit: { message: 'fix: hello, world' } }),
				input({ useConventionalCommits: true }),
				changesets({}),
				{ foundChangeset: false },
				[
					['package.json', { name: '@mscharley/meta', workspaces: ['packages/*'] }],
					['packages/test/package.json', { name: '@mscharley/test' }],
				],
			),
		).toMatchObject({
			affectedPackages: ['@mscharley/test'],
			message: 'fix: hello, world',
			updateType: 'patch',
		});
	});

	it('will exclude a package if it is listed as an ignored package for changesets', () => {
		expect(
			generateChangeset(
				pr({}),
				commit({ commit: { message: 'fix: hello, world' } }),
				input({ useConventionalCommits: true }),
				changesets({ ignore: ['@mscharley/test'] }),
				{ foundChangeset: false },
				[['package.json', { name: '@mscharley/test' }], ['package.json', { name: '@mscharley/test2' }]],
			),
		).toMatchObject({
			affectedPackages: ['@mscharley/test2'],
			message: 'fix: hello, world',
			updateType: 'patch',
		});
	});

	it('will exclude a package if it is listed as an ignored glob for changesets', () => {
		expect(
			generateChangeset(
				pr({}),
				commit({ commit: { message: 'fix: hello, world' } }),
				input({ useConventionalCommits: true }),
				changesets({ ignore: ['@mscharley/*'] }),
				{ foundChangeset: false },
				[['package.json', { name: '@other/test' }], ['package.json', { name: '@mscharley/test2' }]],
			),
		).toMatchObject({
			affectedPackages: ['@other/test'],
			message: 'fix: hello, world',
			updateType: 'patch',
		});
	});

	it('will exclude the changeset if only ignored packages are included', () => {
		expect(
			generateChangeset(
				pr({}),
				commit({ commit: { message: 'fix: hello, world' } }),
				input({ useConventionalCommits: true }),
				changesets({ ignore: ['@mscharley/test'] }),
				{ foundChangeset: false },
				[['package.json', { name: '@mscharley/test' }]],
			),
		).toBeNull();
	});
});
