
// logger which just sends to console
export const ConsoleLogger = {
	log(...args) {
		console.log(...args)
	},

	error(...args) {
		console.error(...args)
	},
}

// logger which does nothing
export const NoOpLogger = {
	log() {},
	error() {},
}
