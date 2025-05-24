import { describe, expect, it, jest } from '@jest/globals';

jest.unstable_mockModule('@actions/core', () => ({ info: (): void => {}, debug: (): void => {} }));

const { isInChangesetScope, isHiddenPrivatePackage } = await import('../processPullRequest.js');

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
});
