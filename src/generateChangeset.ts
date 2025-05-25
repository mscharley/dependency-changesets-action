import type { Commit, PullRequest } from './model/Github.js';
import { debug, info } from '@actions/core';
import type { ActionInput } from './io/parseInput.js';
import type { ChangesetsConfiguration } from './model/ChangesetsConfiguration.js';
import { debugJson } from './io/debugJson.js';
import type { NpmPackage } from './model/NpmPackage.js';
import { parseConventionalCommitMessage } from './parseConventionalCommitMessage.js';
import type { PatchResults } from './io/github/parsePatch.js';

export interface Changeset {
	affectedPackages: string[];
	updateType: 'major' | 'minor' | 'patch';
	message: string;
}

export const generateChangeset = (
	pr: PullRequest,
	{ commit }: Commit,
	input: Omit<ActionInput, 'octokit'>,
	changesets: ChangesetsConfiguration,
	patch: Omit<PatchResults, 'packageFiles'>,
	packageFiles: Array<[string, NpmPackage]>,
): Changeset | null => {
	debug(`Processing PR #${pr.number}: ${pr.title}`);
	const updateType = input.useConventionalCommits ? parseConventionalCommitMessage(commit.message) : 'patch';
	if (updateType === 'none') {
		info('Detected an update type of none, skipping this PR');
		return null;
	}

	if (patch.foundChangeset) {
		info('Changeset has already been pushed');
		return null;
	}
	debugJson('Found patched package files', packageFiles);
	const ignoredPackages = changesets.ignore ?? [];
	debugJson('Found ignored packages', ignoredPackages);

	const packageMap = Object.fromEntries(
		packageFiles.flatMap(([path, p]): Array<[string, string]> => {
			const isMetaPackage = p.workspaces != null;
			const isIgnored = ignoredPackages.includes(p.name ?? '');
			if (isMetaPackage || isIgnored || p.name == null) {
				return [];
			} else {
				return [[path, p.name]];
			}
		}),
	);

	debugJson('Mapping for packages', packageMap);
	const affectedPackages = Object.values(packageMap);

	if (affectedPackages.length < 1) {
		info('No package.json files were updated');
		return null;
	}

	return {
		affectedPackages,
		message: commit.message,
		updateType,
	};
};
