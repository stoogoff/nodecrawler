#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const axios = require('axios')

const Crawler = require('./crawler')
const Robots = require('./robots')


//const BASE_URL = new URL('https://www.aegeanrpg.com/')
//const BASE_URL = new URL('http://localhost:8000/site/')
const BASE_URL = new URL('https://we-evolve.co.uk')
// process.argv[2]

async function fetchRemoteRobots(url, headers) {
	try {
		const response = await axios.get(url, headers)

		return response.data
	}
	catch(ex) {
		if(ex.response) {
			console.log(`Error fetching /robots.txt: ${ex.response.status} (${ex.response.statusText})`)
		}
		else {
			console.log(ex)
		}
	}

	return ''
}

function fetchLocalRobots(file) {
	return fs.readFileSync(path.join(__dirname, file), 'utf8')
}


async function main() {
	const crawler = new Crawler(BASE_URL)
	const robot = new Robots(BASE_URL)

	let remoteRobots = await fetchRemoteRobots(new URL('robots.txt', BASE_URL.origin))
	let localRobots = fetchLocalRobots('robots.txt')

	try {
		robot.parse(remoteRobots)
		robot.parse(localRobots)

		let count = 20

		do {
			const url = crawler.next()

			if(!url) break

			if(!robot.canCrawl(url)) {
				console.log(`Robots skip: ${url}`)
				crawler.update(url, -1)
				continue
			}

			if(new URL(url).origin !== BASE_URL.origin) {
				console.log(`External skip: ${url}`)
				crawler.update(url, -1)
				continue
			}

			console.log(`Crawling: ${url}`)

			await crawler.visit(url)

			//if(--count <= 0) break
		}
		while(true)

		const visited = crawler.visited
		const _200 = Object.values(visited).filter(v => v.status === 200).map(v => v.url)
		const _404 = Object.values(visited).filter(v => v.status === 404).map(v => v.url)

		console.log(robot.logs)
		console.log('200s:', _200)
		console.log('404s:', _404)
		//console.log(visited)
	}
	catch(ex) {
		console.error(ex)
	}

}

main()
