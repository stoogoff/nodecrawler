
import { Crawler, ROBOTS_SKIP, EXTERNAL_URL } from './crawler.js'
import { Robots } from './robots.js'
import { NoOpLogger } from './logger.js'

export async function crawl(baseUrl, logger = NoOpLogger) {
	const crawler = new Crawler(baseUrl)
	const robot = new Robots(baseUrl)

	try {
		robot.load()

		do {
			const url = crawler.next()

			if(!url) break

			if(!robot.canCrawl(url)) {
				logger.log(`Robots skip: ${url}`)
				crawler.update(url, ROBOTS_SKIP)
				continue
			}

			if(new URL(url).origin !== baseUrl.origin) {
				logger.log(`External skip: ${url}`)
				crawler.update(url, EXTERNAL_URL)
				continue
			}

			try {
				const result = await crawler.visit(url)

				logger.log(`Crawled: ${url} with response = ${result}`)
			}
			catch(ex) {
				logger.error(ex)
			}
		}
		while(true)

		return crawler.visited
	}
	catch(ex) {
		logger.error(ex)
	}

	return null
}
