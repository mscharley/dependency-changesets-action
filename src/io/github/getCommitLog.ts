import type { Commit, PullRequest } from '../../model/Github.js';
import type { getOctokit } from '@actions/github';

export const getCommitLog = async (
	octokit: ReturnType<typeof getOctokit>,
	owner: string,
	repo: string,
	pr: PullRequest,
): Promise<Commit[]> => {
	const commits = await octokit.rest.pulls.listCommits({ owner, repo, pull_number: pr.number });

	return commits.data;
};
