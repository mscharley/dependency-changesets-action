import { assert } from 'generic-type-guard';
import { debug } from '@actions/core';
import type { OctokitClient } from '../OctokitClient.js';
import { parse as parseYaml } from 'yaml';
import type { TypeGuard } from 'generic-type-guard';

export const getOptionalFile
	= (octokit: OctokitClient, owner: string, repo: string, ref: string) =>
		<T>(guard: TypeGuard<T>) =>
			async (path: string, dataType?: 'json' | 'text' | 'yaml'): Promise<[string, T | null]> => {
				debug(`Fetching file from ${owner}/${repo}#${ref}:${path}`);
				const response = await octokit.rest.repos.getContent({
					owner,
					repo,
					ref,
					path,
					mediaType: {
						format: 'raw',
					},
				}).catch((err) => {
					if (err instanceof Error) {
						debug(`Received an error while retrieving file: ${owner}/${repo}#${ref}:${path}`);
						debug(err.message);
					}
					return null;
				});
				if (response == null) {
					return [path, null];
				}

				if (typeof response.data !== 'string') {
					throw new Error(`Invalid data when retrieving package file: ${owner}/${repo}#${ref}:${path}`);
				}
				const dt = dataType ?? 'json';
				const data: unknown = dt === 'json' ? JSON.parse(response.data) : dt === 'yaml' ? parseYaml(response.data) : response.data;
				assert(data, guard, `Invalid contents for file ${owner}/${repo}#${ref}:${path}`);

				return [path, data];
			};

export const getFile
	= (octokit: OctokitClient, owner: string, repo: string, ref: string) =>
		<T>(guard: TypeGuard<T>) =>
			async (path: string, dataType?: 'json' | 'text' | 'yaml'): Promise<[string, T]> => {
				const [p, v] = await getOptionalFile(octokit, owner, repo, ref)(guard)(path, dataType);

				if (v == null) {
					throw new Error(`No file found on Github, or there was an error fetching the file: ${owner}/${repo}#${ref}:${path}`);
				}

				return [p, v];
			};
