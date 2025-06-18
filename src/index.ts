import { run } from './main.js';
import { setFailed } from '@actions/core';
import { stringifyError } from './stringifyError.js';

await run().catch((error) => {
	// Fail the workflow run if an error occurs
	if (error instanceof Error) {
		const errorText = stringifyError(error);
		setFailed(errorText);
	} else {
		setFailed(`${error}`);
	}
});
