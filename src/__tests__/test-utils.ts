import type { Commit, PullRequest } from '../model/Github';
import type { ActionInput } from '../io/parseInput';
import type { ChangesetsConfiguration } from '../model/ChangesetsConfiguration';

export declare type DeepPartial<T> =
	| T
	| (T extends Array<infer U>
		? Array<DeepPartial<U>>
		: T extends Map<infer K, infer V>
			? Map<DeepPartial<K>, DeepPartial<V>>
			: T extends Set<infer M>
				? Set<DeepPartial<M>>
				: T extends object
					? {
							[K in keyof T]?: DeepPartial<T[K]>;
						}
					: T);

export const changesets = (inp: DeepPartial<ChangesetsConfiguration>): ChangesetsConfiguration =>
	inp as ChangesetsConfiguration;
export const input = (inp: DeepPartial<ActionInput>): ActionInput => inp as ActionInput;
export const pr = (inp: DeepPartial<PullRequest>): PullRequest => inp as PullRequest;
export const commit = (inp: DeepPartial<Commit>): Commit => inp as Commit;
