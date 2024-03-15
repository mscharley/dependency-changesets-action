import { debug, setOutput } from '@actions/core';
import { getCommitLog } from './io/github/getCommitLog';
import { getEvent } from './io/getEvent';
import { getFile } from './io/github/getFile';
import { getPrPatch } from './io/github/getPrPatch';
import { isChangesetsConfiguration } from './model/ChangesetsConfiguration';
import { parseInput } from './io/parseInput';
import { processPullRequest } from './processPullRequest';

/**
 * The main function for the action.
 * @returns {Promise<void>} Resolves when the action is complete.
 */
export async function run(): Promise<void> {
	// Debug logs are only output if the `ACTIONS_STEP_DEBUG` secret is true
	const { octokit, ...input } = parseInput();
	const { pull_request: pr } = await getEvent();
	if (pr.state !== 'open') {
		console.log(`Short-circuiting as it appears this pull request is not open: ${pr.state}`);
		return;
	}

	const owner = pr.base.repo.owner?.login ?? pr.base.repo.organization;
	const repo = pr.base.repo.name;
	const ref = pr.head.ref;
	if (owner == null) {
		throw new Error('Unable to determine the owner of this repo.');
	}

	const getFromGithub = getFile(octokit, owner, repo, ref);
	const commits = await getCommitLog(octokit, owner, repo, pr);
	const changesetsConfig = await getFromGithub(isChangesetsConfiguration)(`${input.changesetFolder}/config.json`);

	const patchString = await getPrPatch(octokit, owner, repo, pr.number);
	const changeset = await processPullRequest(
		input,
		owner,
		repo,
		pr,
		patchString,
		changesetsConfig,
		commits,
		getFromGithub,
	);
	if (changeset == null) {
		setOutput('created-changeset', false);
		return;
	}

	debug('Pushing changeset to Github');
	const { content, outputPath } = changeset;
	await octokit.rest.repos.createOrUpdateFileContents({
		owner,
		repo,
		branch: ref,
		path: outputPath,
		message: input.commitMessage,
		content: Buffer.from(content, 'utf8').toString('base64'),
		author: input.author,
	});

	// Set outputs for other workflow steps to use
	setOutput('created-changeset', true);
}
