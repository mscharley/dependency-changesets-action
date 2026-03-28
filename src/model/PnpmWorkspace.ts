/* eslint-disable @typescript-eslint/no-type-alias */
import { isArray, IsInterface, isNumber, isString, isUnion } from 'generic-type-guard';
import type { GuardedType } from 'generic-type-guard';

// YAML may parse bare version numbers (e.g. pinned `2` or `3.0`) as numbers rather than strings
export const isPnpmCatalog = new IsInterface().withStringIndexSignature(isUnion(isString, isNumber)).get();
export type PnpmCatalog = GuardedType<typeof isPnpmCatalog>;

export const isPnpmWorkspace = new IsInterface()
	.withOptionalProperties({
		packages: isArray(isString),
		catalog: isPnpmCatalog,
		catalogs: new IsInterface().withStringIndexSignature(isPnpmCatalog).get(),
	})
	.get();
export type PnpmWorkspace = GuardedType<typeof isPnpmWorkspace>;
