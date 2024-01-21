import type { ActionInput } from './io/parseInput';
import { debug } from '@actions/core';
import { debugJson } from './io/debugJson';
import type { NpmPackage } from './model/NpmPackage';
import { parseConventionalCommitMessage } from './parseConventionalCommitMessage';
import type { PatchResults } from './io/github/parsePatch';
import type { PullRequest } from './io/getEvent';

export interface Changeset {
	affectedPackages: string[];
	updateType: 'major' | 'minor' | 'patch';
	message: string;
}

export const generateChangeset = (
	event: PullRequest,
	input: Omit<ActionInput, 'octokit'>,
	patch: Omit<PatchResults, 'packageFiles'>,
	packageFiles: Array<[string, NpmPackage]>,
): Changeset | null => {
	debug(`Processing PR #${event.number}: ${event.pull_request.title}`);
	const updateType = input.useConventionalCommits ? parseConventionalCommitMessage(event.pull_request.title) : 'patch';
	if (updateType === 'none') {
		console.log('Detected an update type of none, skipping this PR');
		return null;
	}

	if (patch.foundChangeset) {
		console.log('Changeset has already been pushed');
		return null;
	}
	if (packageFiles.length < 1) {
		console.log('No package.json files were updated');
		return null;
	}
	debugJson('Found patched package files', packageFiles);

	const packageMap = Object.fromEntries(
		packageFiles.flatMap(([path, p]): Array<[string, string]> => {
			const validPackage = p.workspaces == null;
			if (!validPackage || p.name == null) {
				return [];
			} else {
				return [[path, p.name]];
			}
		}),
	);

	debugJson('Mapping for packages', packageMap);
	const affectedPackages = Object.values(packageMap);

	return {
		affectedPackages,
		message: event.pull_request.title,
		updateType,
	};
};
