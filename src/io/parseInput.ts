import { getBooleanInput, getInput, warning } from '@actions/core';
import { debugJson } from './debugJson';
import { getOctokit } from '@actions/github';

const USE_SEMANTIC_COMMITS = 'INPUT_USE-SEMANTIC-COMMITS';

export interface ActionInput {
	author?: {
		name: string;
		email: string;
	};
	changesetFolder: string;
	commitMessage: string;
	octokit: ReturnType<typeof getOctokit>;
	useConventionalCommits: boolean;
}

const getAuthor = (): undefined | { name: string; email: string } => {
	const name = getInput('author-name');
	const email = getInput('author-email');
	if (name === '' || email === '') {
		return undefined;
	}

	return { name, email };
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
	};
	debugJson('input', input);

	return {
		...input,
		octokit: getOctokit(getInput('token', { required: true })),
	};
};
