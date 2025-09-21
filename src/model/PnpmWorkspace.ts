/* eslint-disable @typescript-eslint/no-type-alias */
import { isArray, IsInterface, isOptional, isString } from 'generic-type-guard';
import type { GuardedType } from 'generic-type-guard';

export const isPnpmCatalog = new IsInterface().withStringIndexSignature(isString, true).get();
export type PnpmCatalog = GuardedType<typeof isPnpmCatalog>;

export const isPnpmNamedCatalogs = new IsInterface().withStringIndexSignature(isPnpmCatalog).get();
export type PnpmNamedCatalogs = GuardedType<typeof isPnpmNamedCatalogs>;

export interface PnpmCatalogs {
	catalog?: PnpmCatalog;
	catalogs?: PnpmNamedCatalogs;
}

export const isPnpmWorkspace = new IsInterface()
	.withProperties({
		packages: isArray(isString),
		catalog: isOptional(isPnpmCatalog),
		catalogs: isOptional(isPnpmNamedCatalogs),
	})
	.get();
export type PnpmWorkspace = GuardedType<typeof isPnpmWorkspace>;
