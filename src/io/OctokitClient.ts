import { Octokit } from '@octokit/core';
import { paginateRest } from '@octokit/plugin-paginate-rest';
import { restEndpointMethods } from '@octokit/plugin-rest-endpoint-methods';
import { throttling } from '@octokit/plugin-throttling';

export const OctokitClient = Octokit.plugin(
	restEndpointMethods,
	paginateRest,
	throttling,
);
// eslint-disable-next-line @typescript-eslint/no-type-alias
export type OctokitClient = InstanceType<typeof OctokitClient>;
