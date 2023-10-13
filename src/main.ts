import * as core from '@actions/core'
import * as github from '@actions/github'
import { getEvent } from './event'

const parseSemanticCommitMessage = (message: string): 'minor' | 'patch' | 'none' => {
	if (message.startsWith('fix')) {
		return 'patch'
	} else if (message.startsWith('feat')) {
		return 'minor'
	}

	return 'none'
}

/**
 * The main function for the action.
 * @returns {Promise<void>} Resolves when the action is complete.
 */
export async function run(): Promise<void> {
	// Debug logs are only output if the `ACTIONS_STEP_DEBUG` secret is true
	const event = await getEvent()
	if (event.pull_request.state !== 'open') {
		console.log('Short-circuiting as it appears this pull request is not open anymore')
		return
	}

	core.debug(`Processing PR #${event.number}: ${event.pull_request.title}`)
	const useSemanticCommits = core.getBooleanInput('use-semantic-commits')
	const updateType = useSemanticCommits ? parseSemanticCommitMessage(event.pull_request.title) : 'patch'
	if (updateType === 'none') {
		console.log('Detected an update type of none, skipping this PR')
		return
	}

	const changesetFolder = core.getInput('changeset-folder')
	core.debug(`Writing changesets to ${changesetFolder}`)
	const name = `dependencies-GH-${event.number}.md`
	core.debug(`Writing changeset named ${name}`)

	core.debug(`Fetching patch`)
	const octokit = github.getOctokit(core.getInput('token'))
	const patchResponse = await octokit.request({
		url: event.pull_request.patch_url
	})
	const patch = patchResponse.data as string
	console.log(patch)

	// Set outputs for other workflow steps to use
	core.setOutput('created-changeset', false)
}
