# Changesets for dependency updaters

This action aims to bring support for the [changesets][changesets] release management software to [Mend
Renovate][renovate] and other dependency updating services.

This action will watch for pull requests from these services and add a changeset if appropriate for that update.

## Usage

```yaml
- uses: mscharley/dependency-changesets-action@v1.0.5
  with:
    # Personal access token (PAT) used to update the pull request. Using a PAT is highly recommended as it will allow
    # Github Actions to run any actions you have configured to run.
    #
    # If using a PAT, the only required permission is "Contents" to read the contents of the PR and potentially push a
    # commit back to the branch.
    #
    # [Learn more about creating and using encrypted secrets](https://help.github.com/en/actions/automating-your-workflow-with-github-actions/creating-and-using-encrypted-secrets)
    #
    # Default: ${{ github.token }}
    token: ''

    # The folder to look for changesets in and to write update changesets into.
    changeset-folder: '.changeset'

    # Whether to use conventional commit messages by the dependency service to determine the type of changeset to
    # create.
    use-conventional-commits: true

    # The commit message to use when committing a changeset.
    commit-message: 'chore(deps): changeset for dependency update'

    # Provide a custom author for the commit.
    #
    # This can be useful for some services, for example Renovate has a configuration to ignore certain authors so that
    # the pushes made by this action don't invalidate the check it does that no extra commits have been added to the PR.
    #
    # Default: no custom author
    author-name: ''
    author-email: ''
```

### Full workflow example

```yaml
name: Add changeset to Renovate updates

on:
  pull_request_target:
    types: [opened, synchronize, labeled]

jobs:
  renovate:
    name: Update Renovate PR
    runs-on: ubuntu-latest
    if: contains(github.event.pull_request.labels.*.name, 'dependencies')

    steps:
      - name: Update PR
        uses: mscharley/dependency-changesets-action@v1.0.5
        with:
          token: ${{ secrets.DEPENDENCY_UPDATE_GITHUB_TOKEN }}
          use-conventional-commits: true
          author-name: Renovate Changesets
          author-email: github+renovate@scharley.me
```

Some important notes:

1. This example uses `pull_request_target` which is necessary to get access to secrets. This type of workflow comes with
   some [security concerns][gh-pull_request_target]. This workflow is safe as presented, but be aware of the gotchas if
   you want to add other actions into the same workflow.
1. This workflow will only run on pull requests with the `dependencies` label. The examples below includes configuration
   to get this working. You can use any filter you like, but it is important that you have some semi-reliable filter on
   this workflow so that it only runs for dependency updates.

## Supported dependency updaters

### Renovate

```jsonc
// renovate.json
{
	"extends": [":label(dependencies)"],
	"automergeType": "pr",
	"gitIgnoredAuthors": ["github+renovate@scharley.me"]
}
```

### Others

Others are likely able to be used with this Action as well, it doesn't rely on any particular feature of the updater
service - these are the services we've tested and know work. If you've got an example for another service then please
reach out so we can add it to the list!

## License

The scripts and documentation in this project are released under the [MIT License][license]

[changesets]: https://github.com/changesets/changesets#readme
[renovate]: https://github.com/apps/renovate
[gh-pull_request_target]: https://securitylab.github.com/research/github-actions-preventing-pwn-requests/
[license]: https://github.com/mscharley/dependency-changesets-action/blob/main/LICENSE
