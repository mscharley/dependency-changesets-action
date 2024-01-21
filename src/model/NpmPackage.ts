/* eslint-disable @typescript-eslint/no-type-alias */
import { isArray, IsInterface, isString } from 'generic-type-guard';
import type { GuardedType } from 'generic-type-guard';

export const isNpmPackage = new IsInterface()
	.withOptionalProperties({
		name: isString,
		workspaces: isArray(isString),
	})
	.get();
export type NpmPackage = GuardedType<typeof isNpmPackage>;
