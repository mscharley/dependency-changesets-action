/* eslint-disable @typescript-eslint/no-type-alias */
import { isArray, isBoolean, IsInterface, isString, isUnion } from 'generic-type-guard';
import type { GuardedType } from 'generic-type-guard';

// https://github.com/changesets/changesets/blob/main/packages/config/schema.json
export const isChangesetsConfiguration = new IsInterface()
	.withOptionalProperties({
		ignore: isArray(isString),
		privatePackages: isUnion(
			isBoolean,
			new IsInterface().withOptionalProperties({ tag: isBoolean, version: isBoolean }).get(),
		),
	})
	.get();

export type ChangesetsConfiguration = GuardedType<typeof isChangesetsConfiguration>;
