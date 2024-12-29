
import { crawl } from './crawl.js'
import { ConsoleLogger } from './logger.js'

const BASE_URL = new URL('https://we-evolve.co.uk')

async function main() {
	const visited = await crawl(BASE_URL, ConsoleLogger)

	const _200 = Object.values(visited).filter(v => v.status === 200).map(v => v.url)
	const _404 = Object.values(visited).filter(v => v.status === 404).map(v => v.url)

	console.log('200s:', _200)
	console.log('404s:', _404)
}

main()
