/**
 * Unit tests for the action's entrypoint, src/index.ts
 */

// eslint-disable-next-line import/no-namespace
import * as main from '../main';

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
