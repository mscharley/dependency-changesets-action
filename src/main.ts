import { debug, setOutput } from '@actions/core';
import { debugJson } from './io/debugJson';
import { generateChangeset } from './generateChangeset';
import { getCommitLog } from './io/github/getCommitLog';
import { getEvent } from './io/getEvent';
import { getFile } from './io/github/getFile';
import { getPrPatch } from './io/github/getPrPatch';
import { isChangesetsConfiguration } from './model/ChangesetsConfiguration';
import { isNpmPackage } from './model/NpmPackage';
import { join as joinPath } from 'node:path';
import { parseInput } from './io/parseInput';
import { parsePatch } from './io/github/parsePatch';

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

	const commits = await getCommitLog(octokit, owner, repo, pr);
	if (commits.length > 1) {
		debugJson('Refusing to update a PR with more than one commit', commits);
		return;
	}
	debug(`Writing changesets to ${input.changesetFolder}`);
	const name = `dependencies-GH-${pr.number}.md`;
	debug(`Writing changeset named ${name}`);
	const outputPath = joinPath(input.changesetFolder, name);
	console.log(`Creating changeset: ${owner}/${repo}#${pr.head.ref}:${outputPath}`);

	debug('Fetching patch');
	const patchString = await getPrPatch(octokit, owner, repo, pr.number);
	const patch = parsePatch(patchString, outputPath);
	const packageFiles = await Promise.allSettled(
		patch.packageFiles.map(getFile(octokit, owner, repo, ref, isNpmPackage)),
	);
	const errs = packageFiles.filter((v): v is PromiseRejectedResult => v.status === 'rejected');
	if (errs.length > 0) {
		throw new AggregateError(errs.map((v) => v.reason as Error));
	}
	const changesets = await getFile(
		octokit,
		owner,
		repo,
		ref,
		isChangesetsConfiguration,
	)(`${input.changesetFolder}/config.json`);

	const changeset = generateChangeset(
		pr,
		commits[0],
		input,
		changesets,
		patch,
		packageFiles.flatMap((v) => (v.status === 'fulfilled' ? [v.value] : [])),
	);
	if (changeset == null) {
		setOutput('created-changeset', false);
		return;
	}

	const content = `---
${changeset.affectedPackages.map((p) => `"${p}": ${changeset.updateType}\n`).join('')}---

${pr.title}
`;
	debug('Pushing changeset to Github');
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
