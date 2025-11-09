import { getFile, getOptionalFile } from './github/getFile.js';
import { getCommitLog } from './github/getCommitLog.js';
import { getPrPatch } from './github/getPrPatch.js';
import { isChangesetsConfiguration } from '../model/ChangesetsConfiguration.js';
import { isNpmPackage } from '../model/NpmPackage.js';
import { isPnpmLock } from '../model/PnpmLock.js';
import { isPnpmWorkspace } from '../model/PnpmWorkspace.js';
import { join } from 'node:path';
import type { OctokitClient } from './OctokitClient.js';
import type { PullRequest } from '../model/Github.js';
import { warning } from '@actions/core';

export const fetchRequiredGithubFiles = async (
	octokit: OctokitClient,
	owner: string,
	repo: string,
	pr: PullRequest,
	changesetFolder: string,
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type, @typescript-eslint/explicit-module-boundary-types
) => {
	const getFromGithub = getFile(octokit, owner, repo, pr.head.ref);
	const maybeGetFromGithub = getOptionalFile(octokit, owner, repo, pr.head.ref);

	const [
		commits,
		patchString,
		[, changesetsConfig],
		[, pnpmWorkspace],
		[, pnpmLock],
		[, rootPackageJson],
	] = await Promise.all([
		getCommitLog(octokit, owner, repo, pr),
		getPrPatch(octokit, owner, repo, pr.number),
		getFromGithub(isChangesetsConfiguration)(`${changesetFolder}/config.json`),
		maybeGetFromGithub(isPnpmWorkspace)(join(changesetFolder, '../pnpm-workspace.yaml'), 'yaml'),
		maybeGetFromGithub(isPnpmLock)(join(changesetFolder, '../pnpm-lock.yaml'), 'yaml'),
		maybeGetFromGithub(isNpmPackage)(join(changesetFolder, '../package.json')),
	]);
	const validPnpmLock = pnpmLock == null || pnpmLock.lockfileVersion === '9.0';
	if (!validPnpmLock && (pnpmWorkspace?.catalog != null || pnpmWorkspace?.catalogs != null)) {
		warning('It looks like this repository is using catalogs but catalog updates are only supported in repositories using PNPM version >= 9.0.0 with a lockfile');
		pnpmWorkspace.catalogs = undefined;
		pnpmWorkspace.catalog = undefined;
	}

	return {
		getFromGithub,
		maybeGetFromGithub,
		commits,
		patchString,
		changesetsConfig,
		pnpmWorkspace,
		pnpmLock,
		rootPackageJson,
	};
};
