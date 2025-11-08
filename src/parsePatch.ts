import type { CatalogUpdates } from './pnpm/calculateCatalogUpdates.js';
import parseDiff from 'parse-diff';

export interface PatchResults {
	packageFiles: string[];
	foundChangeset: boolean;
}

const MATCH_PACKAGE_VERSION = /^\+\s*"?([^\s]+?)"?:\s+"?([^\s]+?)"?$/u;

export const parsePatch = (patch: string, changesetFile: string, catalog: CatalogUpdates): PatchResults => {
	const diff = parseDiff(patch);
	const packageFiles = diff
		.flatMap(({ to, chunks }) => {
			if (to == null) {
				return [];
			}

			if (to === 'package.json' || to.endsWith('/package.json')) {
				return [to];
			}

			if (to === 'pnpm-workspace.yaml' || to.endsWith('/pnpm-workspace.yaml')) {
				return chunks
					.flatMap((chunk) => chunk.changes.filter((change) => change.type === 'add'))
					.flatMap(({ content }): string[] => {
						const m = content.match(MATCH_PACKAGE_VERSION);
						if (m == null) {
							return [];
						}

						const packageId = `${m[1]}@${m[2]}`;
						return catalog[packageId]?.map((v) => v.packageFile) ?? [];
					});
			}

			return [];
		});

	return {
		// Dedupe the results before returning them
		packageFiles: [...new Set(packageFiles)],
		foundChangeset: diff.find((f) => f.to === changesetFile) != null,
	};
};
