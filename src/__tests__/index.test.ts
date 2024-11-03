/**
 * Unit tests for the action's entrypoint, src/index.ts
 */

import { describe, expect, it, jest } from '@jest/globals';

// Mock the action's entrypoint

const runMock = jest.fn<() => Promise<void>>().mockImplementation(async () => Promise.resolve(undefined));

jest.unstable_mockModule('../main.js', () => ({ run: runMock }));

describe('index', () => {
	it('calls run when imported', async () => {
		await import('../index.js');

		expect(runMock).toHaveBeenCalledTimes(1);
	});
});
