import { getBooleanInput, getInput, info, warning } from '@actions/core';
import { debugJson } from './debugJson.js';
import { OctokitClient } from './OctokitClient.js';

const USE_SEMANTIC_COMMITS = 'INPUT_USE-SEMANTIC-COMMITS';

export interface Author {
	email: string;
	name: string;
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

	const githubToken = getInput('token', { required: true });
	const octokit = new OctokitClient({
		auth: `token ${githubToken}`,
		throttle: {
			onRateLimit: (retryAfter, options): boolean => {
				warning(`Request quota exhausted for request ${options.method} ${options.url}`);
				if (options.request.retryCount === 0) {
					// only retries once
					info(`Retrying after ${retryAfter} seconds!`);
					return true;
				}
				return false;
			},
			onSecondaryRateLimit: (_retryAfter, options): void => {
				// does not retry, only logs a warning
				warning(`SecondaryRateLimit detected for request ${options.method} ${options.url}`);
			},
		},
	});

	return { ...input, octokit };
};
