import type { Commit, PullRequest } from './model/Github.js';
import { debug, info } from '@actions/core';
import { dirname, join as joinPath, resolve } from 'node:path';
import { isNpmPackage, type NpmPackage } from './model/NpmPackage.js';
import type { ActionInput } from './io/parseInput.js';
import type { CatalogUpdates } from './pnpm/calculateCatalogUpdates.js';
import type { ChangesetsConfiguration } from './model/ChangesetsConfiguration.js';
import { debugJson } from './io/debugJson.js';
import { generateChangeset } from './generateChangeset.js';
import { Minimatch } from 'minimatch';
import { parsePatch } from './parsePatch.js';
import type { TypeGuard } from 'generic-type-guard';

type PackageFilter = (description: [string, NpmPackage]) => boolean;
const yes: PackageFilter = () => true;

export const isInChangesetScope = (changesetFolder: string): PackageFilter => {
	const baseDir = dirname(resolve('/', changesetFolder));

	return ([path, _]) => resolve('/', path).startsWith(baseDir);
};

export const isHiddenPrivatePackage = (config: ChangesetsConfiguration): PackageFilter => {
	const filterPrivatePackages
		= typeof config.privatePackages === 'boolean'
			? !config.privatePackages
			: !(config.privatePackages?.version ?? true);

	if (filterPrivatePackages) {
		debug(`Filtering private packages`);
		return ([_, v]) => !((typeof v.private === 'string' ? v.private === 'true' : v.private) ?? false);
	} else {
		return yes;
	}
};

export const isInWorkspaces = (changesetFolder: string, workspaces: undefined | string[]): PackageFilter => {
	if (workspaces == null) {
		return yes;
	}

	const baseDir = dirname(resolve('/', changesetFolder));
	debug(`Filtering packages by workspaces in ${baseDir}`);
	const validPackageFiles = workspaces.map((w) => new Minimatch(resolve(baseDir, w, 'package.json'), {}));

	return ([path, _]) => {
		const resolved = resolve('/', path);

		return validPackageFiles.reduce((acc, v) => acc || v.match(resolved), false);
	};
};

export interface UploadFile {
	content: string;
	outputPath: string;
}

export const processPullRequest = async (
	input: Omit<ActionInput, 'octokit'>,
	owner: string,
	repo: string,
	pr: PullRequest,
	patchString: string,
	changesetsConfig: ChangesetsConfiguration,
	commits: Commit[],
	getFile: <T>(guard: TypeGuard<T>) => (path: string) => Promise<[string, T]>,
	catalogs: CatalogUpdates,
	workspaces: string[] | undefined,
): Promise<UploadFile | null> => {
	if (commits.length !== 1) {
		debugJson('Refusing to update a PR with more than one commit', commits);
		return null;
	}
	debug(`Writing changesets to ${input.changesetFolder}`);
	const name = `dependencies-GH-${pr.number}.md`;
	debug(`Writing changeset named ${name}`);
	const outputPath = joinPath(input.changesetFolder, name);
	info(`Creating changeset: ${owner}/${repo}#${pr.head.ref}:${outputPath}`);

	debug('Fetching patch');
	const patch = parsePatch(patchString, outputPath, catalogs);
	if (patch.foundChangeset) {
		info(`Found an already existing changeset: ${outputPath}`);
		return null;
	}
	const packageFiles = await Promise.allSettled(patch.packageFiles.map(getFile(isNpmPackage)));
	const errs = packageFiles.filter((v): v is PromiseRejectedResult => v.status === 'rejected');
	if (errs.length > 0) {
		throw new AggregateError(errs.map((v) => v.reason as Error));
	}

	const validPackageFiles = packageFiles
		.flatMap((v) => (v.status === 'fulfilled' ? [v.value] : []))
		.filter(isInChangesetScope(input.changesetFolder))
		.filter(isHiddenPrivatePackage(changesetsConfig))
		.filter(isInWorkspaces(input.changesetFolder, workspaces));

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
