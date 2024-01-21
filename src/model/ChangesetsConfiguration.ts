/* eslint-disable @typescript-eslint/no-type-alias */
import { isArray, IsInterface, isString } from 'generic-type-guard';
import type { GuardedType } from 'generic-type-guard';

export const isChangesetsConfiguration = new IsInterface()
	.withOptionalProperties({
		ignore: isArray(isString),
	})
	.get();

export type ChangesetsConfiguration = GuardedType<typeof isChangesetsConfiguration>;
