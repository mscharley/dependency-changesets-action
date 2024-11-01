/**
 * Unit tests for the action's entrypoint, src/index.ts
 */

import * as main from '../main.js';

// Mock the action's entrypoint
// eslint-disable-next-line @typescript-eslint/require-await
const runMock = jest.spyOn(main, 'run').mockImplementation(async () => undefined);

describe('index', () => {
	it('calls run when imported', () => {
		// eslint-disable-next-line @typescript-eslint/no-require-imports
		require('../index');

		expect(runMock).toHaveBeenCalledWith();
	});
});
