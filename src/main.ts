import { debug, setOutput } from '@actions/core';
import { debugJson } from './io/debugJson';
import { getEvent } from './io/getEvent';
import { getFile } from './github/getFile';
import { getPrPatch } from './github/getPrPatch';
import { join as joinPath } from 'node:path';
import { parseInput } from './io/parseInput';
import { parsePatch } from './github/parsePatch';

const parseSemanticCommitMessage = (message: string): 'minor' | 'patch' | 'none' => {
	if (message.startsWith('fix')) {
		return 'patch';
	} else if (message.startsWith('feat')) {
		return 'minor';
	}

	return 'none';
};

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

	const { author, changesetFolder, commitMessage, octokit, useConventionalCommits } = parseInput();

	const owner = event.pull_request.base.repo.owner?.login ?? event.pull_request.base.repo.organization;
	const repo = event.pull_request.base.repo.name;
	if (owner == null) {
		throw new Error('Unable to determine the owner of this repo.');
	}

	debug(`Processing PR #${event.number}: ${event.pull_request.title}`);
	const updateType = useConventionalCommits ? parseSemanticCommitMessage(event.pull_request.title) : 'patch';
	if (updateType === 'none') {
		console.log('Detected an update type of none, skipping this PR');
		setOutput('created-changeset', false);
		return;
	}

	debug(`Writing changesets to ${changesetFolder}`);
	const name = `dependencies-GH-${event.number}.md`;
	debug(`Writing changeset named ${name}`);
	const outputPath = joinPath(changesetFolder, name);
	console.log(`Creating changeset: ${owner}/${repo}#${event.pull_request.head.ref}:${outputPath}`);

	debug('Fetching patch');
	const patchString = await getPrPatch(octokit, owner, repo, event.number);
	const patch = parsePatch(patchString, outputPath);

	if (patch.foundChangeset) {
		console.log('Changeset has already been pushed');
		setOutput('created-changeset', false);
		return;
	}
	if (patch.packageFiles.length < 1) {
		console.log('No package.json files were updated');
		setOutput('created-changeset', false);
		return;
	}
	debugJson('Found patched package files', patch.packageFiles);

	const packageMap = Object.fromEntries(
		(await Promise.all(patch.packageFiles.map(getFile(octokit, owner, repo, event.pull_request.head.ref)))).flatMap(
			([path, p]): Array<[string, string]> => {
				const validPackage = p.workspaces == null;
				if (!validPackage || p.name == null) {
					return [];
				} else {
					return [[path, p.name]];
				}
			},
		),
	);

	debugJson('Mapping for packages', packageMap);
	const packages = Object.values(packageMap);
	const changeset = `---
${packages.map((p) => `"${p}": ${updateType}\n`).join('')}---

${event.pull_request.title}
`;

	debug('Pushing changeset to Github');
	await octokit.rest.repos.createOrUpdateFileContents({
		owner,
		repo,
		branch: event.pull_request.head.ref,
		path: outputPath,
		message: commitMessage,
		content: Buffer.from(changeset, 'utf8').toString('base64'),
		author,
	});

	// Set outputs for other workflow steps to use
	setOutput('created-changeset', true);
}
