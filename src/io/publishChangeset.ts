import { CreateCommitDocument, type CreateCommitMutationVariables } from '../generated/graphql.js';
import type { OctokitClient, Ref } from '../model/Github.js';
import type { Author } from './parseInput.js';
import { debug } from '@actions/core';
import { debugJson } from './debugJson.js';
import type { UploadFile } from '../processPullRequest.js';

export const publishChangeset = async (
	octokit: OctokitClient,
	owner: string,
	repo: string,
	head: Ref,
	file: UploadFile,
	commitMessage: string,
	author: Author | undefined,
	signCommit: boolean,
): Promise<void> => {
	const { content, outputPath } = file;
	const base64Content = Buffer.from(content, 'utf8').toString('base64');

	if (signCommit) {
		debug('Pushing changeset to Github');
		if (author != null) {
			throw new Error('Custom author information is incompatible with signing commits.');
		}
		await octokit.graphql(CreateCommitDocument.toString(), {
			commit: {
				clientMutationId: 'mscharley/dependency-changesets-action',
				branch: {
					repositoryNameWithOwner: `${owner}/${repo}`,
					branchName: head.ref,
				},
				message: {
					headline: commitMessage,
				},
				expectedHeadOid: head.sha,
				fileChanges: {
					additions: [
						{
							path: outputPath,
							contents: base64Content,
						},
					],
				},
			},
		} satisfies CreateCommitMutationVariables);
	} else {
		debugJson('Pushing changeset to Github', { owner, repo, head, outputPath });
		try {
			await octokit.rest.repos.createOrUpdateFileContents({
				owner,
				repo,
				branch: head.ref,
				path: outputPath,
				message: commitMessage,
				content: base64Content,
				author,
			});
		} catch (e) {
			if (e instanceof Error && e.message.includes(`"sha" wasn't supplied`)) {
				throw new Error('Attempted to update a changeset instead of creating a new one - this is probably a bug.', { cause: e });
			}
			throw e;
		}
	}
};
