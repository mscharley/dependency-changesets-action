import type { PullRequest } from '../model/Github.js';
import { readFile } from 'node:fs/promises';

// https://docs.github.com/en/webhooks/webhook-events-and-payloads#pull_request
export interface PullRequestEvent {
	number: number;
	pull_request: PullRequest;
}

export const getEvent = async (): Promise<PullRequestEvent> => {
	if (process.env.GITHUB_EVENT_PATH == null) {
		throw new Error('GITHUB_EVENT_PATH is not set, is this running in Github Actions?');
	}

	const event: unknown = JSON.parse((await readFile(process.env.GITHUB_EVENT_PATH)).toString('utf-8'));

	if (!(typeof event === 'object' && event != null && 'pull_request' in event)) {
		throw new Error('Event doesn\'t have a pull_request available.');
	}

	return event as PullRequestEvent;
};
