import type { Commit, PullRequest } from './model/Github.js';
import type { ActionInput } from './io/parseInput.js';
import type { ChangesetsConfiguration } from './model/ChangesetsConfiguration.js';
import { debug } from '@actions/core';
import { debugJson } from './io/debugJson.js';
import { generateChangeset } from './generateChangeset.js';
import { isNpmPackage } from './model/NpmPackage.js';
import { join as joinPath } from 'node:path';
import { parsePatch } from './io/github/parsePatch.js';
import type { TypeGuard } from 'generic-type-guard';

export const processPullRequest = async (
	input: Omit<ActionInput, 'octokit'>,
	owner: string,
	repo: string,
	pr: PullRequest,
	patchString: string,
	changesetsConfig: ChangesetsConfiguration,
	commits: Commit[],
	getFile: <T>(guard: TypeGuard<T>) => (path: string) => Promise<[string, T]>,
): Promise<{ content: string; outputPath: string } | null> => {
	if (commits.length !== 1) {
		debugJson('Refusing to update a PR with more than one commit', commits);
		return null;
	}
	debug(`Writing changesets to ${input.changesetFolder}`);
	const name = `dependencies-GH-${pr.number}.md`;
	debug(`Writing changeset named ${name}`);
	const outputPath = joinPath(input.changesetFolder, name);
	console.log(`Creating changeset: ${owner}/${repo}#${pr.head.ref}:${outputPath}`);

	debug('Fetching patch');
	const patch = parsePatch(patchString, outputPath);
	const packageFiles = await Promise.allSettled(patch.packageFiles.map(getFile(isNpmPackage)));
	const errs = packageFiles.filter((v): v is PromiseRejectedResult => v.status === 'rejected');
	if (errs.length > 0) {
		throw new AggregateError(errs.map((v) => v.reason as Error));
	}

	const filterPrivatePackages
		= typeof changesetsConfig.privatePackages === 'boolean'
			? !changesetsConfig.privatePackages
			: !(changesetsConfig.privatePackages?.version ?? true);
	debug(`Filtering private packages: ${filterPrivatePackages}`);
	const validPackageFiles = packageFiles
		.flatMap((v) => (v.status === 'fulfilled' ? [v.value] : []))
		.filter(([_, v]) => !filterPrivatePackages || !(v.private ?? false));

	const changeset = generateChangeset(pr, commits[0], input, changesetsConfig, patch, validPackageFiles);
	if (changeset == null) {
		return null;
	}

	return {
		content: `---
${changeset.affectedPackages.map((p) => `"${p}": ${changeset.updateType}\n`).join('')}---

${changeset.message}
`,
		outputPath,
	};
};
