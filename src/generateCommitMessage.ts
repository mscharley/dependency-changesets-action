import type { ActionInput } from './io/parseInput.js';

export const generateCommitMessage = (input: Pick<ActionInput, 'author' | 'commitMessage'>): string => {
	if (input.author?.dco === true) {
		return `${input.commitMessage}\n\nSigned-off-by: ${input.author.name} <${input.author.email}>`;
	} else {
		return input.commitMessage;
	}
};
