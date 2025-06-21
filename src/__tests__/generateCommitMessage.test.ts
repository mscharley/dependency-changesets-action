import { describe, expect, it } from '@jest/globals';
import { generateCommitMessage } from '../generateCommitMessage.js';

describe('generateCommitMessage', () => {
	it('can generate a basic commit message based on the input', () => {
		expect(generateCommitMessage({ commitMessage: 'test: commit here' })).toBe('test: commit here');
	});

	it('only signs with DCO if enabled', () => {
		expect(generateCommitMessage({
			author: { name: 'MS', email: 'ms@example.com', dco: false },
			commitMessage: 'test: commit here',
		})).toBe('test: commit here');
	});

	it('can generate a commit message with a DCO signature', () => {
		expect(generateCommitMessage({
			author: { name: 'MS', email: 'ms@example.com', dco: true },
			commitMessage: 'test: commit here',
		})).toBe(`test: commit here\n\nSigned-off-by: MS <ms@example.com>`);
	});
});
