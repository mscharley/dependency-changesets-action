import { debug, setOutput } from '@actions/core';
import { generateChangeset } from './generateChangeset';
import { getEvent } from './io/getEvent';
import { getFile } from './io/github/getFile';
import { getPrPatch } from './io/github/getPrPatch';
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
	const event = await getEvent();
	if (event.pull_request.state !== 'open') {
		console.log(`Short-circuiting as it appears this pull request is not open: ${event.pull_request.state}`);
		return;
	}

	const { octokit, ...input } = parseInput();

	const owner = event.pull_request.base.repo.owner?.login ?? event.pull_request.base.repo.organization;
	const repo = event.pull_request.base.repo.name;
	if (owner == null) {
		throw new Error('Unable to determine the owner of this repo.');
	}

	debug(`Writing changesets to ${input.changesetFolder}`);
	const name = `dependencies-GH-${event.number}.md`;
	debug(`Writing changeset named ${name}`);
	const outputPath = joinPath(input.changesetFolder, name);
	console.log(`Creating changeset: ${owner}/${repo}#${event.pull_request.head.ref}:${outputPath}`);

	debug('Fetching patch');
	const patchString = await getPrPatch(octokit, owner, repo, event.number);
	const patch = parsePatch(patchString, outputPath);
	const packageFiles = await Promise.allSettled(
		patch.packageFiles.map(getFile(octokit, owner, repo, event.pull_request.head.ref, isNpmPackage)),
	);
	const errs = packageFiles.filter((v): v is PromiseRejectedResult => v.status === 'rejected');
	if (errs.length > 0) {
		throw new AggregateError(errs.map((v) => v.reason as Error));
	}

	const changeset = generateChangeset(
		event,
		input,
		patch,
		packageFiles.flatMap((v) => (v.status === 'fulfilled' ? [v.value] : [])),
	);
	if (changeset == null) {
		setOutput('created-changeset', false);
		return;
	}

	const content = `---
${changeset.affectedPackages.map((p) => `"${p}": ${changeset.updateType}\n`).join('')}---

${event.pull_request.title}
`;
	debug('Pushing changeset to Github');
	await octokit.rest.repos.createOrUpdateFileContents({
		owner,
		repo,
		branch: event.pull_request.head.ref,
		path: outputPath,
		message: input.commitMessage,
		content: Buffer.from(content, 'utf8').toString('base64'),
		author: input.author,
	});

	// Set outputs for other workflow steps to use
	setOutput('created-changeset', true);
}
