/* eslint-disable @typescript-eslint/no-type-alias */
import {
	type GuardedType,
	isArray,
	isBoolean,
	IsInterface,
	isString,
	isUnion,
	type TypeGuard,
} from 'generic-type-guard';

const isBooleanString: TypeGuard<'true' | 'false'> = (s: unknown): s is 'true' | 'false' =>
	typeof s === 'string' && ['true', 'false'].includes(s);

export const isNpmPackage = new IsInterface()
	.withOptionalProperties({
		name: isString,
		workspaces: isArray(isString),
		private: isUnion(isBoolean, isBooleanString),
	})
	.get();
export type NpmPackage = GuardedType<typeof isNpmPackage>;
