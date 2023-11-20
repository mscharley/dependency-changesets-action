import { debug } from '@actions/core';
import type { getOctokit } from '@actions/github';

export interface PackageJson {
	name?: string;
	workspaces?: string[];
}

export const getFile =
	(octokit: ReturnType<typeof getOctokit>, owner: string, repo: string, ref: string) =>
	async (path: string): Promise<[string, PackageJson]> => {
		debug(`Fetching package from ${owner}/${repo}/${ref}:${path}`);
		const packageJsonResponse = await octokit.rest.repos.getContent({
			owner,
			repo,
			ref,
			path,
			mediaType: {
				format: 'raw',
			},
		});

		if (typeof packageJsonResponse.data !== 'string') {
			throw new Error(`Invalid data when retrieving package file: ${owner}/${repo}/${ref}:${path}`);
		}
		const packageJson = JSON.parse(packageJsonResponse.data) as { name?: string; workspaces?: string[] };

		return [path, packageJson];
	};
