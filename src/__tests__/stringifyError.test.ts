import { describe, expect, it } from '@jest/globals';
import { stringifyError } from '../stringifyError.js';

describe('stringifyError', () => {
	it('returns the stack for errors which include it', () => {
		const result = stringifyError(new Error('Test'));
		expect(result).toMatch(/^Error: Test\n/su);
		expect(result).toMatch(/^ {4}at /mu);
	});

	it('returns just the message for an error if no stack is included', () => {
		const err = new Error('Test');
		err.stack = undefined;

		expect(stringifyError(err)).toBe('Test');
	});

	it('returns a list of all errors in an AggregateError', () => {
		const err = new AggregateError([new Error('Test 1'), new Error('Test 2')]);
		const result = stringifyError(err);

		expect(result).toMatch(/^Error: Test 1\n/su);
		expect(result).toMatch(/^ {4}at /mu);
		expect(result).toMatch(/\n\nError: Test 2$/mu);
	});
});
