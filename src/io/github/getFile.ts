import { assert } from 'generic-type-guard';
import { debug } from '@actions/core';
import type { getOctokit } from '@actions/github';
import type { TypeGuard } from 'generic-type-guard';

export const getFile
	= (octokit: ReturnType<typeof getOctokit>, owner: string, repo: string, ref: string) =>
		<T>(guard: TypeGuard<T>) =>
			async (path: string): Promise<[string, T]> => {
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
				const packageJson: unknown = JSON.parse(packageJsonResponse.data);
				assert(packageJson, guard, `Invalid contents for file ${owner}/${repo}/${path}`);

				return [path, packageJson];
			};
