/* eslint-disable @typescript-eslint/no-type-alias */
import { isArray, IsInterface, isString } from 'generic-type-guard';
import { isArray, IsInterface, isOptional, isString } from 'generic-type-guard';
import type { GuardedType } from 'generic-type-guard';

export const isPnpmCatalog = new IsInterface().withStringIndexSignature(isString, true).get();
export type PnpmCatalog = GuardedType<typeof isPnpmCatalog>;

export const isPnpmNamedCatalogs = new IsInterface().withStringIndexSignature(isPnpmCatalog).get();
export type PnpmNamedCatalogs = GuardedType<typeof isPnpmNamedCatalogs>;

export const isPnpmWorkspace = new IsInterface()
	.withProperties({
		packages: isArray(isString),
	})
	.get();
export type PnpmWorkspace = GuardedType<typeof isPnpmWorkspace>;
