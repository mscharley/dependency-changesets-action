export const stringifyError = (error: Error): string => {
	if (error instanceof AggregateError) {
		return error.errors.map(stringifyError).join('\n\n');
	}

	if (error.stack == null) {
		return error.message;
	}
	return error.stack;
};
