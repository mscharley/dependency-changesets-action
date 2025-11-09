import type { Commit, PullRequest } from '../../model/Github.js';
import type { OctokitClient } from '../OctokitClient.js';

export const getCommitLog = async (
	octokit: OctokitClient,
	owner: string,
	repo: string,
	pr: PullRequest,
): Promise<Commit[]> => {
	const commits = await octokit.rest.pulls.listCommits({ owner, repo, pull_number: pr.number });

	return commits.data;
};
