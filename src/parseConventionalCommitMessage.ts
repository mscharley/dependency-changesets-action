const conventionalCommit = /^(\w+)(?:\((\w+)\))?(!?):\s*(.*)(?:\n\n(.*))?$/u;

/**
 * Parses a commit message into a release type
 */
export const parseConventionalCommitMessage = (message: string): 'major' | 'minor' | 'patch' | 'none' => {
	const match = message.match(conventionalCommit) as
		| null
		| [string, string, string | undefined, '!' | undefined, string, string | undefined];
	if (match == null) {
		return 'none';
	}

	const [, type, _scope, major, _msg, body] = match;

	if ((body ?? '').match(/^BREAKING[- ]CHANGE:/mu) != null) {
		return 'major';
	} else if (major === '!') {
		return 'major';
	} else if (type === 'fix') {
		return 'patch';
	} else if (type === 'feat') {
		return 'minor';
	}

	return 'none';
};
