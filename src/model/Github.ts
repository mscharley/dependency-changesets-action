/* eslint-disable @typescript-eslint/no-type-alias */
import type { getOctokit } from '@actions/github';

export type OctokitClient = ReturnType<typeof getOctokit>;

export interface Ref {
	ref: string;
	sha: string;
	repo: {
		name: string;
		organization?: string;
		owner?: {
			id: number;
			login: string;
		};
	};
}

export interface PullRequest {
	_links: {
		commits: { href: string };
	};
	base: Ref;
	head: Ref;
	number: number;
	patch_url: string;
	state: 'open' | 'closed';
	title: string;
}

export type Commit = Awaited<ReturnType<ReturnType<typeof getOctokit>['rest']['pulls']['listCommits']>>['data'][number];
