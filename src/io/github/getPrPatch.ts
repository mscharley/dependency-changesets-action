import { debug } from '@actions/core';
import { debugJson } from '../debugJson.js';
import type { OctokitClient } from '../../model/Github.js';

export const getPrPatch = async (
	octokit: OctokitClient,
	owner: string,
	repo: string,
	pullNumber: number,
): Promise<string> => {
	const patchResponse = await octokit.rest.pulls.get({
		repo,
		owner,
		pull_number: pullNumber,
		mediaType: {
			format: 'diff',
		},
	});
	if (typeof patchResponse.data !== 'string') {
		debug(typeof patchResponse.data);
		debugJson('data', patchResponse.data);
		throw new Error('Patch from Github isn\'t a string');
	}

	return patchResponse.data as unknown as string;
};
