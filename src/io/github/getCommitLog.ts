import type { Commit, OctokitClient, PullRequest } from '../../model/Github.js';

export const getCommitLog = async (
	octokit: OctokitClient,
	owner: string,
	repo: string,
	pr: PullRequest,
): Promise<Commit[]> => {
	const commits = await octokit.rest.pulls.listCommits({ owner, repo, pull_number: pr.number });

	return commits.data;
};
