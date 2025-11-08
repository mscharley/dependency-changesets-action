import { getBooleanInput, getInput, info, warning } from '@actions/core';
import { throttling, type ThrottlingOptions } from '@octokit/plugin-throttling';
import { debugJson } from './debugJson.js';
import { getOctokit } from '@actions/github';
import type { OctokitClient } from '../model/Github.js';

const USE_SEMANTIC_COMMITS = 'INPUT_USE-SEMANTIC-COMMITS';

export interface Author {
	name: string;
	email: string;
	dco: boolean;
}

export interface ActionInput {
	author?: Author;
	changesetFolder: string;
	commitMessage: string;
	octokit: OctokitClient;
	useConventionalCommits: boolean;
	signCommits: boolean;
}

const getAuthor = (): ActionInput['author'] => {
	const name = getInput('author-name');
	const email = getInput('author-email');
	const dco = getBooleanInput('author-dco', { required: true });
	if (name === '' || email === '') {
		return undefined;
	}

	return { name, email, dco };
};

export const parseInput = (): ActionInput => {
	const hasSemanticCommitConfig = process.env[USE_SEMANTIC_COMMITS] != null && process.env[USE_SEMANTIC_COMMITS] !== '';
	if (hasSemanticCommitConfig) {
		warning(
			'The use-semantic-commits option was renamed to use-conventional-commits and will be removed at some point',
		);
	}

	const input = {
		author: getAuthor(),
		changesetFolder: getInput('changeset-folder', { required: true }),
		commitMessage: getInput('commit-message', { required: true }),
		useConventionalCommits: hasSemanticCommitConfig
			? getBooleanInput('use-semantic-commits', { required: true })
			: getBooleanInput('use-conventional-commits', { required: true }),
		signCommits: getBooleanInput('sign-commits', { required: true }),
	} satisfies Omit<ActionInput, 'octokit'>;
	debugJson('input', input);

	const throttlingOptions: ThrottlingOptions = {
		onRateLimit: (retryAfter, options) => {
			warning(`Request quota exhausted for request ${options.method} ${options.url}`);
			if (options.request.retryCount === 0) {
				// only retries once
				info(`Retrying after ${retryAfter} seconds!`);
				return true;
			}
			return false;
		},
		onSecondaryRateLimit: (_retryAfter, options) => {
			// does not retry, only logs a warning
			warning(`SecondaryRateLimit detected for request ${options.method} ${options.url}`);
		},
	};
	const octokit = getOctokit(getInput('token', { required: true }), {
		throttle: throttlingOptions,
	}, throttling);

	return { ...input, octokit };
};
