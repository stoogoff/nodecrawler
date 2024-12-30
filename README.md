
# nodecrawler

A simple website crawler written in Node. It honours a `robots.txt` file and can be provided with a local robots file to use in the crawl.

Basic usage:

```Javascript
import { crawl } from './crawl.js'
import { ConsoleLogger } from './logger.js'

async function main() {
  const logger = ConsoleLogger
  const visited = await crawl('https://example.com', logger)

  const _200 = Object.values(visited).filter(v => v.status === 200).map(v => v.url)
  const _404 = Object.values(visited).filter(v => v.status === 404).map(v => v.url)

  logger.log('200s:', _200)
  logger.log('404s:', _404)
}

main()
```
