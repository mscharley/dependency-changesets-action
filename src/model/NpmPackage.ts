/* eslint-disable @typescript-eslint/no-type-alias */
import {
	isArray,
	isBoolean,
	IsInterface,
	isOptional,
	isSingletonStringUnion,
	isString,
	isUnion,
} from 'generic-type-guard';
import type { GuardedType } from 'generic-type-guard';

export const isNpmPackage = new IsInterface()
	.withOptionalProperties({
		name: isString,
		workspaces: isOptional(isArray(isString)),
		private: isUnion(isBoolean, isSingletonStringUnion('true', 'false')),
	})
	.get();
export type NpmPackage = GuardedType<typeof isNpmPackage>;
