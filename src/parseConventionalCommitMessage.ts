import { debug } from '@actions/core';

const conventionalCommit = /^(\w+)(?:\((\w+)\))?(!?):\s*(.*)(?:\n\n(.*))?$/u;

/**
 * Parses a commit message into a release type
 */
export const parseConventionalCommitMessage = (message: string): 'major' | 'minor' | 'patch' | 'none' => {
	debug(`Treating commit message as a conventional commit: ${message}`);
	const match = message.match(conventionalCommit) as
		| null
		| [string, string, string | undefined, '!' | undefined, string, string | undefined];
	if (match == null) {
		return 'none';
	}

	const [, type, _scope, major, _msg, body] = match;

	if ((body ?? '').match(/^BREAKING[- ]CHANGE:/mu) != null) {
		debug('Treating this commit as a major update.');
		return 'major';
	} else if (major === '!') {
		debug('Treating this commit as a major update.');
		return 'major';
	} else if (type === 'fix') {
		debug('Treating this commit as a patch update.');
		return 'patch';
	} else if (type === 'feat') {
		debug('Treating this commit as a minor update.');
		return 'minor';
	}

	debug('No releaseable change in the commit message, ignoring this commit.');
	return 'none';
};
