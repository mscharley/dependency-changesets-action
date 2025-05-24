import { describe, expect, it, jest } from '@jest/globals';

jest.unstable_mockModule('@actions/core', () => ({ info: (): void => {}, debug: (): void => {} }));

const { isInChangesetScope, isHiddenPrivatePackage, isInWorkspaces } = await import('../processPullRequest.js');

describe('packageFilters', () => {
	describe('isInChangesetScope', () => {
		it('handles projects in the repo root', () => {
			expect(isInChangesetScope('.changeset')(['test/package.json', {}])).toBe(true);
		});

		it('allows files inside the changeset folder when not in the repo root', () => {
			expect(isInChangesetScope('subdir/.changeset')(['subdir/package.json', {}])).toBe(true);
		});

		it('disallows files outside the changeset folder when not in the repo root', () => {
			expect(isInChangesetScope('subdir/.changeset')(['other/package.json', {}])).toBe(false);
		});
	});

	describe('isHiddenPrivatePackage', () => {
		it('doesn\'t filter packages which are private if option disabled`', () => {
			expect(isHiddenPrivatePackage({ privatePackages: true })(['', { private: true }])).toBe(true);
			expect(isHiddenPrivatePackage({})(['', { private: true }])).toBe(true);
		});

		it('filters packages which are private if option enabled', () => {
			expect(isHiddenPrivatePackage({ privatePackages: false })(['', { private: true }])).toBe(false);
		});

		it('doesn\'t filter packages which are private if versioning is disabled', () => {
			expect(isHiddenPrivatePackage({ privatePackages: { version: true } })(['', { private: true }])).toBe(true);
		});

		it('filters packages which are private if versioning is enabled', () => {
			expect(isHiddenPrivatePackage({ privatePackages: { version: false } })(['', { private: true }])).toBe(false);
		});

		it('doesn\'t filter packages which are private if only tagging is disabled', () => {
			expect(isHiddenPrivatePackage({ privatePackages: { tag: true } })(['', { private: true }])).toBe(true);
		});

		it('doesn\'t filter packages which are private if only tagging is enabled', () => {
			expect(isHiddenPrivatePackage({ privatePackages: { tag: false } })(['', { private: true }])).toBe(true);
		});
	});

	describe('isInWorkspaces', () => {
		it('allows files if there are no workspaces', () => {
			expect(isInWorkspaces('.changeset', null)(['test/package.json', {}])).toBe(true);
		});

		it('allows files if they match workspaces', () => {
			expect(isInWorkspaces('.changeset', ['a/'])(['a/package.json', {}])).toBe(true);
		});

		it('blocks files if they don\'t match workspaces', () => {
			expect(isInWorkspaces('.changeset', ['a/'])(['b/package.json', {}])).toBe(false);
		});

		it('correctly namespaces by changesets location', () => {
			expect(isInWorkspaces('subdir/.changeset', ['a/'])(['subdir/a/package.json', {}])).toBe(true);
			expect(isInWorkspaces('subdir/.changeset', ['a/'])(['a/package.json', {}])).toBe(false);
			expect(isInWorkspaces('subdir/.changeset', ['a/'])(['other/a/package.json', {}])).toBe(false);
		});

		it('handles globs', () => {
			expect(isInWorkspaces('.changeset', ['packages/*'])(['packages/a/package.json', {}])).toBe(true);
		});
	});
});
