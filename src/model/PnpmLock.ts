/* eslint-disable @typescript-eslint/no-type-alias */
import { type GuardedType, IsInterface, isString } from 'generic-type-guard';

// https://github.com/pnpm/spec/tree/master/lockfile

const isDependencyDefinition = new IsInterface().withProperties({ specifier: isString }).get();
const isPackageList = new IsInterface()
	.withStringIndexSignature(isDependencyDefinition)
	.get();

export const isPnpmLock = new IsInterface().withOptionalProperties({
	lockfileVersion: isString,
	importers: new IsInterface()
		.withStringIndexSignature(new IsInterface().withOptionalProperties({
			dependencies: isPackageList,
			devDependencies: isPackageList,
			peerDependencies: isPackageList,
			optionalDependencies: isPackageList,
		}).get())
		.get(),
}).get();
export type PnpmLock = GuardedType<typeof isPnpmLock>;
