import type { TypeGuard } from 'generic-type-guard';

export interface PatchResults {
	packageFiles: string[];
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

	return {
		packageFiles: changed.filter((f) => f === 'package.json' || f.endsWith('/package.json')),
		foundChangeset: changed.includes(changesetFile),
	};
};
