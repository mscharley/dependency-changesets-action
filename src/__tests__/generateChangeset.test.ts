import { input, pr } from './test-utils';
import type { Changeset } from '../generateChangeset';
import { generateChangeset } from '../generateChangeset';

describe('generateChangeset', () => {
	describe('conventional commits', () => {
		it('will return a patch if conventional commits is disabled', () => {
			expect(
				generateChangeset(
					pr({ pull_request: { title: 'chore: hello, world' } }),
					input({ useConventionalCommits: false }),
					{ foundChangeset: false },
					[['package.json', { name: '@mscharley/test' }]],
				),
			).toMatchObject<Changeset>({
				affectedPackages: ['@mscharley/test'],
				message: 'chore: hello, world',
				updateType: 'patch',
			});
		});

		it('will return no changeset for no update', () => {
			expect(
				generateChangeset(
					pr({ pull_request: { title: 'chore: hello, world' } }),
					input({ useConventionalCommits: true }),
					{ foundChangeset: false },
					[['package.json', { name: '@mscharley/test' }]],
				),
			).toBeNull();
		});
	});

	it('will return no changeset if there are no affected packages', () => {
		expect(
			generateChangeset(
				pr({ pull_request: { title: 'fix: hello, world' } }),
				input({ useConventionalCommits: true }),
				{ foundChangeset: false },
				[],
			),
		).toBeNull();
	});

	it('will return no changeset if there is already one detected', () => {
		expect(
			generateChangeset(
				pr({ pull_request: { title: 'fix: hello, world' } }),
				input({ useConventionalCommits: true }),
				{ foundChangeset: true },
				[['package.json', { name: '@mscharley/test' }]],
			),
		).toBeNull();
	});

	it('will exclude a package if it is detected as a workspace metapackage', () => {
		expect(
			generateChangeset(
				pr({ pull_request: { title: 'fix: hello, world' } }),
				input({ useConventionalCommits: true }),
				{ foundChangeset: false },
				[
					['package.json', { name: '@mscharley/meta', workspaces: ['packages/*'] }],
					['packages/test/package.json', { name: '@mscharley/test' }],
				],
			),
		).toMatchObject<Changeset>({
			affectedPackages: ['@mscharley/test'],
			message: 'fix: hello, world',
			updateType: 'patch',
		});
	});
});
