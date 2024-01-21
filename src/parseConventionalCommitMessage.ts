/**
 * Parses a commit message into a release type
 */
export const parseConventionalCommitMessage = (message: string): 'major' | 'minor' | 'patch' | 'none' => {
	if (message.startsWith('fix')) {
		return 'patch';
	} else if (message.startsWith('feat')) {
		return 'minor';
	}

	return 'none';
};
