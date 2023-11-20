import { debug } from '@actions/core';

const DEBUG_INDENT = 2;

export const debugJson = (message: string, obj: unknown): void => {
	debug(`${message}: ${JSON.stringify(obj, undefined, DEBUG_INDENT)}`);
};
