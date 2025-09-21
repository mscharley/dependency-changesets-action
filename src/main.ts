import { debug, info, setOutput } from '@actions/core';
import { getFile, getOptionalFile } from './io/github/getFile.js';
import { CreateCommitDocument } from './generated/graphql.js';
import type { CreateCommitMutationVariables } from './generated/graphql.js';
import { debugJson } from './io/debugJson.js';
import { generateCommitMessage } from './generateCommitMessage.js';
import { getCommitLog } from './io/github/getCommitLog.js';
import { getEvent } from './io/getEvent.js';
import { getPrPatch } from './io/github/getPrPatch.js';
import { isChangesetsConfiguration } from './model/ChangesetsConfiguration.js';
import { isNpmPackage } from './model/NpmPackage.js';
import { isPnpmWorkspace } from './model/PnpmWorkspace.js';
import { join } from 'node:path';
import { parseInput } from './io/parseInput.js';
import { processPullRequest } from './processPullRequest.js';

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
	const ref = pr.head.ref;
	if (owner == null) {
		throw new Error('Unable to determine the owner of this repo.');
	}

	const getFromGithub = getFile(octokit, owner, repo, ref);
	const maybeGetFromGithub = getOptionalFile(octokit, owner, repo, ref);
	const [commits, patchString, [, changesetsConfig], [, pnpmWorkspaces], [, rootPackageJson]] = await Promise.all([
		getCommitLog(octokit, owner, repo, pr),
		getPrPatch(octokit, owner, repo, pr.number),
		getFromGithub(isChangesetsConfiguration)(`${input.changesetFolder}/config.json`),
		maybeGetFromGithub(isPnpmWorkspace)(join(input.changesetFolder, '../pnpm-workspace.yaml'), 'yaml'),
		maybeGetFromGithub(isNpmPackage)(join(input.changesetFolder, '../package.json')),
	]);
	debugJson('Changesets configuration', changesetsConfig);

	const changeset = await processPullRequest(
		input,
		owner,
		repo,
		pr,
		patchString,
		changesetsConfig,
		commits,
		pnpmWorkspaces,
		rootPackageJson,
		getFromGithub,
	);
	if (changeset == null) {
		setOutput('created-changeset', false);
		return;
	}

	const commitMessage = generateCommitMessage(input);
	const { content, outputPath } = changeset;
	if (input.signCommits) {
		debug('Pushing changeset to Github');
		if (input.author != null) {
			throw new Error('Custom author information is incompatible with signing commits.');
		}
		await octokit.graphql(CreateCommitDocument.toString(), {
			commit: {
				clientMutationId: 'mscharley/dependency-changesets-action',
				branch: {
					repositoryNameWithOwner: `${owner}/${repo}`,
					branchName: pr.head.ref,
				},
				message: {
					headline: commitMessage,
				},
				expectedHeadOid: pr.head.sha,
				fileChanges: {
					additions: [
						{
							path: outputPath,
							contents: Buffer.from(content, 'utf8').toString('base64'),
						},
					],
				},
			},
		} satisfies CreateCommitMutationVariables);
	} else {
		debugJson('Pushing changeset to Github', { owner, repo, ref, outputPath });
		try {
			await octokit.rest.repos.createOrUpdateFileContents({
				owner,
				repo,
				branch: ref,
				path: outputPath,
				message: commitMessage,
				content: Buffer.from(content, 'utf8').toString('base64'),
				author: input.author,
			});
		} catch (e) {
			if (e instanceof Error && e.message.includes(`"sha" wasn't supplied`)) {
				throw new Error('Attempted to update a changeset instead of creating a new one - this is probably a bug.', { cause: e });
			}
			throw e;
		}
	}

	// Set outputs for other workflow steps to use
	setOutput('created-changeset', true);
}
