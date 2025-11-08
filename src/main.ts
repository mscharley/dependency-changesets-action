import { info, setOutput } from '@actions/core';
import { calculateCatalogUpdates } from './pnpm/calculateCatalogUpdates.js';
import { debugJson } from './io/debugJson.js';
import { fetchRequiredGithubFiles } from './io/fetchRequiredGithubFiles.js';
import { generateCommitMessage } from './generateCommitMessage.js';
import { getEvent } from './io/getEvent.js';
import { parseInput } from './io/parseInput.js';
import { processPullRequest } from './processPullRequest.js';
import { publishChangeset } from './io/publishChangeset.js';

/**
 * The main function for the action.
 * @returns {Promise<void>} Resolves when the action is complete.
 */
export async function run(): Promise<void> {
	// Debug logs are only output if the `ACTIONS_STEP_DEBUG` secret is true
	const { octokit, ...input } = parseInput();
	const { pull_request: pr } = await getEvent();
	if (pr.state !== 'open') {
		info(`Short-circuiting as it appears this pull request is not open: ${pr.state}`);
		return;
	}

	const owner = pr.base.repo.owner?.login ?? pr.base.repo.organization;
	const repo = pr.base.repo.name;
	if (owner == null) {
		throw new Error('Unable to determine the owner of this repo.');
	}

	const {
		getFromGithub,
		commits,
		patchString,
		changesetsConfig,
		pnpmWorkspace,
		pnpmLock,
		rootPackageJson,
	} = await fetchRequiredGithubFiles(octokit, owner, repo, pr, input.changesetFolder);
	debugJson('Changesets configuration', changesetsConfig);

	const pnpmCatalogs = calculateCatalogUpdates(pnpmWorkspace, pnpmLock);
	const upload = await processPullRequest(
		input,
		owner,
		repo,
		pr,
		patchString,
		changesetsConfig,
		commits,
		getFromGithub,
		pnpmCatalogs,
		pnpmWorkspace?.packages ?? rootPackageJson?.workspaces,
	);
	if (upload == null) {
		setOutput('created-changeset', false);
		return;
	}

	const commitMessage = generateCommitMessage(input);
	await publishChangeset(octokit, owner, repo, pr.head, upload, commitMessage, input.author, input.signCommits);

	// Set outputs for other workflow steps to use
	setOutput('created-changeset', true);
}
