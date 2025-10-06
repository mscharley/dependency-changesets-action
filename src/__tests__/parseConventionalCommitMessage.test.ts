import { describe, expect, it, jest } from '@jest/globals';

jest.unstable_mockModule('@actions/core', () => ({ info: (): void => {}, debug: (): void => {} }));

const { parseConventionalCommitMessage } = await import('../parseConventionalCommitMessage.js');

describe('parseConventionalCommitMessage', () => {
	describe('none', () => {
		it('will return no commit level for non-conventional commits', () => {
			expect(parseConventionalCommitMessage('Hello, world!')).toBe('none');
		});

		it('will return no commit level for other types of commits', () => {
			expect(parseConventionalCommitMessage('ci: update foo')).toBe('none');
		});
	});

	describe('patch', () => {
		it('will return patch for fixes', () => {
			expect(parseConventionalCommitMessage('fix: update foo')).toBe('patch');
		});

		it('will return patch for scopes', () => {
			expect(parseConventionalCommitMessage('fix(deps-dev): update foo')).toBe('patch');
		});
	});

	describe('minor', () => {
		it('will return minor for features', () => {
			expect(parseConventionalCommitMessage('feat: update foo')).toBe('minor');
		});
	});

	describe('major', () => {
		it('will return major for breaking changes', () => {
			expect(parseConventionalCommitMessage('fix: update foo\n\nBREAKING CHANGE: major update')).toBe('major');
		});

		it('will return major for a breaking change footer', () => {
			expect(parseConventionalCommitMessage('fix: update foo\n\nBREAKING-CHANGE: major update')).toBe('major');
		});

		it('will respect exclamation marks', () => {
			expect(parseConventionalCommitMessage('fix!: update foo')).toBe('major');
		});

		it('will respect exclamation marks with a provided scope', () => {
			expect(parseConventionalCommitMessage('fix(deps)!: update foo')).toBe('major');
		});
	});
});
