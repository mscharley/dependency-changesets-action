import * as core from '@actions/core'
import { getEvent } from './event'

/**
 * The main function for the action.
 * @returns {Promise<void>} Resolves when the action is complete.
 */
export async function run(): Promise<void> {
	// Debug logs are only output if the `ACTIONS_STEP_DEBUG` secret is true
	const event = await getEvent()
	if (event.pull_request.state !== 'open') {
		core.debug('Short-circuiting as it appears this pull request is not open anymore')
	}

	const changesetFolder: string = core.getInput('changeset-folder')
	core.debug(`Writing changesets to ${changesetFolder}`)

	const name = `dependencies-GH-${event.number}.md`
	core.debug(`Writing changeset named ${name}`)

	// Set outputs for other workflow steps to use
	core.setOutput('created-changeset', false)
}
