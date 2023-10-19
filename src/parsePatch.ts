export interface PatchResults {
	packageFiles: string[]
	foundChangeset: boolean
}

const changedFiles = /^\+\+\+ b\/(.*)$/gmu

export const parsePatch = (patch: string, changesetFile: string): PatchResults => {
	const changed = [...patch.matchAll(changedFiles)].map(match => match[1])

	return {
		packageFiles: changed.filter(f => f === 'package.json' || f.endsWith('/package.json')),
		foundChangeset: changed.includes(changesetFile)
	}
}
