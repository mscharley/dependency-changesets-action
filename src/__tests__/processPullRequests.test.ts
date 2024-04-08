import type { Commit, PullRequest } from '../model/Github';
import type { ActionInput } from '../io/parseInput';
import type { ChangesetsConfiguration } from '../model/ChangesetsConfiguration';
import type { DeepPartial } from './test-utils';
import { processPullRequest } from '../processPullRequest';

const owner = 'mscharley';
const repo = 'dependency-changesets-action';

const partial = <T>(x: DeepPartial<T>): T => x as T;
const getFiles
	= (files: Record<string, unknown>) =>
	<T>() =>
		// eslint-disable-next-line @typescript-eslint/require-await
			async (path: string): Promise<[string, T]> => {
				if (path in files) {
					return [JSON.stringify(files[path]), files[path] as T];
				} else {
					throw new Error('Invalid file requested');
				}
			};

describe('processPullRequests', () => {
	it('fails if there are more than one commit', async () => {
		await expect(
			processPullRequest(
				partial<ActionInput>({}),
				owner,
				repo,
				partial<PullRequest>({}),
				'',
				partial<ChangesetsConfiguration>({}),
				[partial<Commit>({}), partial<Commit>({})],
				getFiles({}),
			),
		).resolves.toBeNull();
	});

	it('fails if there are no commits', async () => {
		await expect(
			processPullRequest(
				partial<ActionInput>({}),
				owner,
				repo,
				partial<PullRequest>({}),
				'',
				partial<ChangesetsConfiguration>({}),
				[],
				getFiles({}),
			),
		).resolves.toBeNull();
	});

	it('successfully creates a new changeset', async () => {
		await expect(
			processPullRequest(
				partial<ActionInput>({ changesetFolder: '.changeset' }),
				owner,
				repo,
				partial<PullRequest>({
					number: 10,
					title: 'fix: update test package',
					head: { ref: 'update-test' },
				}),
				`
diff --git a/package.json b/package.json
index 0c63967..4733d7e 100644
--- a/package.json
+++ b/package.json
@@ -96,6 +96,6 @@
                "stryker-cli": "1.0.2",
                "ts-jest": "29.1.1",
                "ts-node": "10.9.1",
-               "typescript": "5.2.0"
+               "typescript": "5.2.2"
        }
 }
`,
				partial<ChangesetsConfiguration>({}),
				[partial<Commit>({ commit: { message: 'fix: update test package' } })],
				getFiles({
					'package.json': { name: '@mscharley/test' },
				}),
			),
		).resolves.toMatchObject({
			content: `---
"@mscharley/test": patch
---

fix: update test package
`,
			outputPath: '.changeset/dependencies-GH-10.md',
		});
	});
});
