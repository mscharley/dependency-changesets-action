import { debug, getBooleanInput, getInput, setOutput } from '@actions/core';
import { getEvent } from './event';
import { getOctokit } from '@actions/github';
import { join as joinPath } from 'node:path';
import { parsePatch } from './parsePatch';

const DEBUG_INDENT = 2;

const parseSemanticCommitMessage = (message: string): 'minor' | 'patch' | 'none' => {
	if (message.startsWith('fix')) {
		return 'patch';
	} else if (message.startsWith('feat')) {
		return 'minor';
	}

	return 'none';
};

const getAuthor = (): undefined | { name: string; email: string } => {
	const name = getInput('author-name');
	const email = getInput('author-email');
	if (name === '' || email === '') {
		return undefined;
	}

	return { name, email };
};

/**
 * The main function for the action.
 * @returns {Promise<void>} Resolves when the action is complete.
 */
export async function run(): Promise<void> {
	// Debug logs are only output if the `ACTIONS_STEP_DEBUG` secret is true
	const event = await getEvent();
	if (event.pull_request.state !== 'open') {
		console.log('Short-circuiting as it appears this pull request is not open anymore');
		return;
	}

	const owner = event.pull_request.base.repo.owner?.login ?? event.pull_request.base.repo.organization;
	const repo = event.pull_request.base.repo.name;
	if (owner == null) {
		throw new Error('Unable to determine the owner of this repo.');
	}

	debug(`Processing PR #${event.number}: ${event.pull_request.title}`);
	const useSemanticCommits = getBooleanInput('use-semantic-commits');
	const updateType = useSemanticCommits ? parseSemanticCommitMessage(event.pull_request.title) : 'patch';
	if (updateType === 'none') {
		console.log('Detected an update type of none, skipping this PR');
		setOutput('created-changeset', false);
		return;
	}

	const changesetFolder = getInput('changeset-folder');
	debug(`Writing changesets to ${changesetFolder}`);
	const name = `dependencies-GH-${event.number}.md`;
	debug(`Writing changeset named ${name}`);
	const outputPath = joinPath(changesetFolder, name);
	console.log(`Creating changeset: ${owner}/${repo}/${event.pull_request.head.ref}:${outputPath}`);

	debug('Fetching patch');
	const octokit = getOctokit(getInput('token'));
	const patchResponse = await octokit.rest.pulls.get({
		repo,
		owner,
		pull_number: event.number,
		mediaType: {
			format: 'diff',
		},
	});
	if (typeof patchResponse.data !== 'string') {
		debug(typeof patchResponse.data);
		debug(JSON.stringify(patchResponse.data, undefined, DEBUG_INDENT));
		throw new Error("Patch from Github isn't a string");
	}
	const patch = parsePatch(patchResponse.data as unknown as string, outputPath);
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
	console.log('Found patched package files:', patch.packageFiles);

	const packageMap = Object.fromEntries(
		await Promise.all(
			patch.packageFiles.map(async (path) => {
				debug(`Fetching package from ${owner}/${repo}/${event.pull_request.head.ref}:${path}`);
				const packageJsonResponse = await octokit.rest.repos.getContent({
					owner,
					repo,
					ref: event.pull_request.head.ref,
					path,
					mediaType: {
						format: 'raw',
					},
				});

				if (typeof packageJsonResponse.data !== 'string') {
					throw new Error(
						`Invalid data when retrieving package file: ${owner}/${repo}/${event.pull_request.head.ref}:${path}`,
					);
				}
				const packageJson = JSON.parse(packageJsonResponse.data) as { name?: string; workspaces?: string[] };

				return [path, packageJson.workspaces == null ? packageJson.name : undefined] as const;
			}),
		),
	);

	debug(`Mapping for packages: ${JSON.stringify(packageMap)}`);
	const packages = Object.values(packageMap).filter(<T>(v: T | null | undefined): v is T => v != null);
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
		message: getInput('commit-message'),
		content: Buffer.from(changeset, 'utf8').toString('base64'),
		author: getAuthor(),
	});

	// Set outputs for other workflow steps to use
	setOutput('created-changeset', true);
}
