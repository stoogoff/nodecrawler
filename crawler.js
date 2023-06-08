
const axios = require('axios')
const { parse } = require('node-html-parser')


// tags we want to follow and the attribute used
const TAG_MAP = {
	a: 'href',
	script: 'src',
	img: 'src',
	link: 'href',
}


class TrackedUrl {
	constructor(url, status) {
		this.referrers = {}
		this.url = url
		this.status = status
	}

	get mustVisit() {
		return this.status === 0
	}

	addReferrer(referrer) {
		if(!this.referrers[referrer]) this.referrers[referrer] = 0

		++this.referrers[referrer]
	}
}

class Crawler {
	constructor(base, headers = {}) {
		this.visited = {}

		this.base = base
		this.add(base.toString())

		this.headers = headers
	}

	add(url, referrer) {
		if(!this.visited[url]) {
			this.visited[url] = new TrackedUrl(url, 0)
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

	async visit(url) {
		try {
			const response = await axios.get(url, this.headers)

			this.update(url, response.status)

			// don't crawl if the origin doesn't match the site's origin
			if(!url.startsWith(this.base.href)) return

			// crawl the HTML structure for new links
			if(response.status === 200 && response.headers['content-type'].startsWith('text/html')) {
				this.crawl(url, response.data)
			}
		}
		catch(ex) {
			if(ex.response) {
				this.update(url, ex.response.status)
			}
			else {
				throw ex
			}
		}
	}

	crawl(referrer, html) {
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

module.exports = Crawler
