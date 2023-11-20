import { readFile } from 'node:fs/promises';

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
	number: number;
	pull_request: {
		_links: {
			commits: { href: string };
		};
		base: Ref;
		head: Ref;
		patch_url: string;
		state: 'open' | 'closed';
		title: string;
	};
}

export const getEvent = async (): Promise<PullRequest> => {
	if (process.env.GITHUB_EVENT_PATH == null) {
		throw new Error('GITHUB_EVENT_PATH is not set, is this running in Github Actions?');
	}

	const event: unknown = JSON.parse((await readFile(process.env.GITHUB_EVENT_PATH)).toString('utf-8'));

	if (!(typeof event === 'object' && event != null && 'pull_request' in event)) {
		throw new Error("Event doesn't have a pull_request available.");
	}

	return event as PullRequest;
};
