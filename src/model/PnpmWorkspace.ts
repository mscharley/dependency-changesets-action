/* eslint-disable @typescript-eslint/no-type-alias */
import { isArray, IsInterface, isString } from 'generic-type-guard';
import type { GuardedType } from 'generic-type-guard';

export const isPnpmCatalog = new IsInterface().withStringIndexSignature(isString).get();
export type PnpmCatalog = GuardedType<typeof isPnpmCatalog>;

export const isPnpmWorkspace = new IsInterface()
	.withProperties({
		packages: isArray(isString),
	})
	.withOptionalProperties({
		catalog: isPnpmCatalog,
		catalogs: new IsInterface().withStringIndexSignature(isPnpmCatalog).get(),
	})
	.get();
export type PnpmWorkspace = GuardedType<typeof isPnpmWorkspace>;
