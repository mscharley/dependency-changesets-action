import type { ActionInput } from 'src/io/parseInput';
import type { PullRequest } from '../io/getEvent';

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

export const pr = (input: DeepPartial<PullRequest>): PullRequest => input as PullRequest;

export const input = (inp: DeepPartial<ActionInput>): ActionInput => inp as ActionInput;
