import type { PnpmLock } from '../model/PnpmLock.js';
import type { PnpmWorkspace } from '../model/PnpmWorkspace.js';
import { warning } from '@actions/core';

export interface CatalogUpdate {
	packageFile: string;
}
// eslint-disable-next-line @typescript-eslint/no-type-alias
export type CatalogUpdates = Record<string, CatalogUpdate[] | undefined>;

/**
 * Returns a mapping from package identifiers from all catalogs to a list of packages that depend on that catalog entry.
 */
export const calculateCatalogUpdates = (workspace: PnpmWorkspace | null, lock: PnpmLock | null): CatalogUpdates => {
	if (workspace == null) {
		return {};
	}

	const catalogs = Object.entries(workspace.catalogs ?? {});
	if (workspace.catalog != null) {
		catalogs.push(['', workspace.catalog]);
	}
	if (catalogs.length > 0 && lock == null) {
		warning('PNPM: detected usage of catalogs, but no lockfile is available. Changesets for catalogs will not be created.');
		return {};
	}

	const results: CatalogUpdates = {};

	catalogs.forEach(([catalogName, catalog]) => {
		const catalogId = `catalog:${catalogName}`;
		Object.entries(catalog).forEach(([name, ver]) => {
			const packageId = `${name}@${ver}`;
			results[packageId] ??= [];

			Object.entries(lock?.importers ?? {}).forEach(([
				path,
				{ dependencies, peerDependencies, devDependencies, optionalDependencies },
			]) => {
				const packageFile = path === '.' ? 'package.json' : `${path}/package.json`;

				if (
					dependencies?.[name]?.specifier === catalogId
					|| peerDependencies?.[name]?.specifier === catalogId
					|| devDependencies?.[name]?.specifier === catalogId
					|| optionalDependencies?.[name]?.specifier === catalogId
				) {
					results[packageId]?.push({ packageFile });
				}
			});
		});
	});

	return results;
};
