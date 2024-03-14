import type { Commit, PullRequest } from './model/Github';
import type { ActionInput } from './io/parseInput';
import type { ChangesetsConfiguration } from './model/ChangesetsConfiguration';
import { debug } from '@actions/core';
import { debugJson } from './io/debugJson';
import type { NpmPackage } from './model/NpmPackage';
import { parseConventionalCommitMessage } from './parseConventionalCommitMessage';
import type { PatchResults } from './io/github/parsePatch';

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
		console.log('Detected an update type of none, skipping this PR');
		return null;
	}

	if (patch.foundChangeset) {
		console.log('Changeset has already been pushed');
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
		console.log('No package.json files were updated');
		return null;
	}

	return {
		affectedPackages,
		message: commit.message,
		updateType,
	};
};
