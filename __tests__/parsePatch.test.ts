import { parsePatch } from '../src/parsePatch'

describe('parsePatch', () => {
	it('parses a patch file with no package.json', () => {
		expect(
			parsePatch(
				`
diff --git a/.github/workflows/changesets.yml b/.github/workflows/changesets.yml
index 03e8948..8560b41 100644
--- a/.github/workflows/changesets.yml
+++ b/.github/workflows/changesets.yml
@@ -19,7 +19,7 @@ jobs:

     steps:
       - name: Checkout Repo
-        uses: actions/checkout@f43a0e5ff2bd294095638e18286ca9a3d1956744 # v3
+        uses: actions/checkout@8ade135a41bc03ea155e62e844d188df1ea18608 # v4

       - name: Setup Node.js
         uses: actions/setup-node@5e21ff4d9bc1a8cf6de233a3057d20ec6b3fb69d # v3
`,
				'.changeset/hello-world.md'
			)
		).toEqual({
			foundChangeset: false,
			packageFiles: []
		})
	})

	it('parses a patch file with updates', () => {
		expect(
			parsePatch(
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
diff --git a/dummy/package.json b/dummy/package.json
index 0c63967..4733d7e 100644
--- a/dummy/package.json
+++ b/dummy/package.json
@@ -96,6 +96,6 @@
                "stryker-cli": "1.0.2",
                "ts-jest": "29.1.1",
                "ts-node": "10.9.1",
-               "typescript": "5.2.0"
+               "typescript": "5.2.2"
        }
 }
`,
				'.changeset/hello-world.md'
			)
		).toEqual({
			foundChangeset: false,
			packageFiles: ['package.json', 'dummy/package.json']
		})
	})

	it('detects an existing changeset', () => {
		expect(
			parsePatch(
				`
diff --git a/package.json b/package.json
index 0c63967..4733d7e 100644
--- a/.changeset/hello-world.md
+++ b/.changeset/hello-world.md
@@ -96,6 +96,6 @@
`,
				'.changeset/hello-world.md'
			)
		).toEqual({
			foundChangeset: true,
			packageFiles: []
		})
	})
})
