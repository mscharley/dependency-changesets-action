import { isPnpmWorkspace, type PnpmCatalogs } from '../../model/PnpmWorkspace.js';
import type { TypeGuard } from 'generic-type-guard';

export interface PatchResults {
	packageFiles: string[];
	catalogs: PnpmCatalogs;
	foundChangeset: boolean;
}

const changedFiles = /^\+\+\+ b\/(.*)$/gmu;

export const parsePatch = async (
	patch: string,
	changesetFile: string,
	getRepoFile: <T>(guard: TypeGuard<T>) => (path: string) => Promise<[string, T]>,
	getPrFile: <T>(guard: TypeGuard<T>) => (path: string) => Promise<[string, T]>,
): Promise<PatchResults> => {
	const changed = [...patch.matchAll(changedFiles)].map((match) => match[1]);

	const packageFiles = changed.filter((f) => f === 'package.json' || f.endsWith('/package.json')),
		workspaceFile = changed.find((f) => f === 'pnpm-workspace.yaml' || f.endsWith('/pnpm-workspace.yaml')),
		changesetsFile = changed.find((f) => f === changesetFile);

	const updatedCatalogs: PnpmCatalogs = {};

	if ('string' === typeof workspaceFile) {
		const [[, repoWorkspace], [, patchWorkspace]] = [
			await getRepoFile(isPnpmWorkspace)(workspaceFile),
			await getPrFile(isPnpmWorkspace)(workspaceFile),
		];

		for (const [entry, value] of Object.entries(patchWorkspace.catalog ?? {})) {
			const previous = repoWorkspace.catalog?.[entry];

			if (value !== previous) {
				updatedCatalogs.catalog = { ...updatedCatalogs.catalog, [entry]: value };
			}
		}

		for (const [namespace, catalog] of Object.entries(patchWorkspace.catalogs ?? {})) {
			const previousCatalog = repoWorkspace.catalogs?.[namespace];

			const updatedCatalogNamespace: Exclude<PnpmCatalogs['catalogs'], undefined> = {};

			if (previousCatalog === undefined) {
				updatedCatalogNamespace[namespace] = catalog;
			} else {
				for (const [entry, value] of Object.entries(catalog)) {
					const previous = previousCatalog[entry];

					if (value !== previous) {
						updatedCatalogNamespace[namespace] = { ...updatedCatalogNamespace[namespace], [entry]: value };
					}
				}
			}

			updatedCatalogs.catalogs = { ...updatedCatalogs.catalogs, [namespace]: updatedCatalogNamespace[namespace] };
		}
	}

	return {
		packageFiles,
		catalogs: updatedCatalogs,
		foundChangeset: 'string' === typeof changesetsFile,
	};
};
