
import axios from 'axios'
import { parse } from 'node-html-parser'


// tags we want to follow and the attribute used
const TAG_MAP = {
	a: 'href',
	script: 'src',
	img: 'src',
	link: 'href',
}

export const UNVISITED_URL = 0
export const UNKNOWN_RESPONSE = -1
export const EXTERNAL_URL = -2
export const ROBOTS_SKIP = -3

export class TrackedUrl {
	constructor(url) {
		this.referrers = {}
		this.url = url
		this.status = UNVISITED_URL
	}

	get mustVisit() {
		return this.status === UNVISITED_URL
	}

	addReferrer(referrer) {
		if(!this.referrers[referrer]) this.referrers[referrer] = 0

		++this.referrers[referrer]
	}
}

export class Crawler {
	constructor(base, headers = {}) {
		this.visited = {}

		this.base = base
		this.add(base.toString())

		this.headers = headers
	}

	add(url, referrer) {
		if(!this.visited[url]) {
			this.visited[url] = new TrackedUrl(url)
		}

		if(referrer) {
			this.visited[url].addReferrer(referrer)
		}
	}

	update(url, status) {
		if(!(url in this.visited)) throw `URL '${url}' not found`

		this.visited[url].status = status
	}

	next() {
		const urls = Object.keys(this.visited)

		for(let i = 0, ilen = urls.length; i < ilen; ++i) {
			if(this.visited[urls[i]].mustVisit) return urls[i]
		}

		return null
	}

	async visit(url, visitor = (response) => {}) {
		try {
			const response = await axios.get(url, this.headers)

			this.update(url, response.status)

			// don't crawl if the origin doesn't match the site's origin
			if(!url.startsWith(this.base.href)) return EXTERNAL_URL

			// crawl the HTML structure for new links
			if(response.status === 200 && response.headers['content-type'].startsWith('text/html')) {
				this.#crawl(url, response.data)
			}

			visitor(response)

			return response.status
		}
		catch(ex) {
			if(ex.response) {
				this.update(url, ex.response.status)
				return ex.response.status
			}
			else {
				throw ex
			}
		}

		return UNKNOWN_RESPONSE
	}

	#crawl(referrer, html) {
		const document = parse(html)

		Object.keys(TAG_MAP).forEach(tag => {
			const tags = document.getElementsByTagName(tag)

			tags.forEach(link => {
				let attr = link.getAttribute(TAG_MAP[tag])

				// skip if it doesn't exist or is a javascript link or page anchor
				if(!attr || attr.startsWith('#') || attr.startsWith('javascript:')) return

				// strip off any anchor
				if(attr.indexOf('#') !== -1) {
					attr = attr.substring(0, attr.indexOf('#'))
				}

				// add the site's origin to relative URLs
				if(!attr.match(/^http/)) {
					attr = new URL(attr, this.base.origin).toString()
				}

				this.add(attr, referrer)
			})
		})
	}
}
