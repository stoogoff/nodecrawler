
const head = ([h]) => h
const tail = ([, ...t]) => t
const DEFAULT_USERAGENT = 'User-agent: *'

class ExactMatchRule {
	constructor(line, path) {
		this.line = line
		this.path = path
	}

	match(url) {
		return url === this.path || url.startsWith(this.path)
	}
}


class WildCardRule {
	constructor(line, path) {
		this.line = line

		const parts = path.split('*')

		this.head = head(parts)
		this.tail = tail(parts)
	}

	match(url) {
		if(!url.startsWith(this.head)) return false

		url = url.replace(this.head, '')

		for(let i = 0, ilen = this.tail.length; i < ilen; ++i) {
			const index = url.indexOf(this.tail[i])

			if(index === -1) return false

			url = url.substring(index + this.tail[i].length)
		}

		return true
	}
}

class Robots {
	constructor(url) {
		this.origin = url.origin
		this.url = new URL('robots.txt', url.origin)
		this.disallow = []
		this.allow = []
		this.logs = []
	}

	parse(data) {
		const lines = data.split(/[\r\n]+/g)
		let userAgent = DEFAULT_USERAGENT

		lines.forEach(line => {
			if(line.startsWith('User-agent')) {
				userAgent = line
			}

			// skip lines until we get to the default user agent
			if(userAgent !== DEFAULT_USERAGENT) {
				return
			}

			readLine(line, 'Disallow:', this.disallow, this.origin)
			readLine(line, 'Allow:', this.allow, this.origin)
		})
	}

	canCrawl(url) {
		const allow = getMatch(this.allow, url)
		const disallow = getMatch(this.disallow, url)

		if(allow !== null) {
			this.logs.push(`ALLOW '${url}' for rule '${allow.line}'`)
			return true
		}

		if(disallow !== null) {
			this.logs.push(`DISALLOW '${url}' for rule '${disallow.line}'`)
			return false
		}

		return true
	}
}


// helpers
function readLine(line, prefix, container, origin) {
	if(line.startsWith(prefix)) {
		let url = line.replace(prefix, '').trim()
		url = new URL(url, origin).toString()

		container.push(createRule(line, url))
	}
}

function getMatch(rules, url) {
	for(let i = 0, ilen = rules.length; i< ilen; ++i) {
		if(rules[i].match(url)) {
			return rules[i]
		}
	}

	return null
}

function createRule(line, url) {
	if(url.indexOf('*') === -1) return new ExactMatchRule(line, url)

	return new WildCardRule(line, url)
}


module.exports = Robots
