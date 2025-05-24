/* eslint-disable @typescript-eslint/no-type-alias */
import { isArray, IsInterface, isString } from 'generic-type-guard';
import type { GuardedType } from 'generic-type-guard';

export const isPnpmWorkspace = new IsInterface()
	.withProperties({
		packages: isArray(isString),
	})
	.get();
export type PnpmWorkspace = GuardedType<typeof isPnpmWorkspace>;
