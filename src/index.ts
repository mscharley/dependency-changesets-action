import { run } from './main.js';
import { setFailed } from '@actions/core';

run().catch((error) => {
	// Fail the workflow run if an error occurs
	if (error instanceof Error) {
		setFailed(error);
	} else {
		setFailed(`${error}`);
	}
});
