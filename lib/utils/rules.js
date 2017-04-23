const geoipLite = require('geoip-lite')
const MobileDetect = require('mobile-detect')
const NOT_FOUND = 'NOT_FOUND'

const evaluateRules = (criteria, req, options, userRules, log) => {
  const final = {
    match: undefined,
    numRules: 0,
    rulesMatched: 0
  }

  if (!criteria) {
    final.match = true
    return final
  }

  Object.keys(criteria).forEach(key => {
    // handle operators AND and OR after the forEach
    if (['and', 'or'].indexOf(key) >= 0) { return }

    // first search for the key in userRules - this allows user to override splitterRules
    if (userRules[key]) {
      final.numRules++
      const result = userRules[key](criteria[key], req)
      const type = typeof result
      if (type !== 'boolean') {
        final.numRules--
        log.warn(`Custom rule '${key}' ignored! It returned ${result} (type: ${type}) when it should've returned a boolean.`)
      } else if (result) {
        final.rulesMatched++
      }
    } else if (splitterRules[key]) {
      final.numRules++
      if (splitterRules[key](criteria[key], req, options)) { final.rulesMatched++ }
    } else {
      log.warn(`Callback to evaluate rule '${key}' not found. Rule ignored.`)
    }
  })

  // array of rules AND is treated as a single rule and not as the whole
  if (criteria.and && criteria.and.length > 0) {
    final.numRules++
    if (criteria.and.map(single => evaluateRules(single, req, options, userRules, log).match).every(match => match)) {
      final.rulesMatched++
    }
  }

  // array of rules OR is treated as a single rule and not as the whole
  if (criteria.or && criteria.or.length > 0) {
    final.numRules++
    if (criteria.or.map(single => evaluateRules(single, req, options, userRules, log).match).some(match => match)) {
      final.rulesMatched++
    }
  }

  final.match = final.numRules === final.rulesMatched
  return final
}

module.exports = { evaluateRules }

const evaluateHost = (criteria, req) => {
  if (!req.headers || !req.headers.host) { return false }
  return criteria.indexOf(req.headers.host) >= 0
}

const evaluatePath = (criteria, req) => {
  if (!req.url) { return false }
  return criteria.some(path => {
    const cut = req.url.substr(0, path.length)
    // if req.url subtring and path equals doesn't necessarily mean they should match
    // because req.url can be bigger than the path
    // for example: req.url = '/rules' and path = '/rule'
    // cut will be /rule and it will match the path, but this is wrong
    // this issue is solved by walidating their size and the next char of req.url
    if (cut !== path) { return false }
    if (req.url.length === path.length) { return true }
    return ['/', '?'].indexOf(req.url[path.length]) >= 0
  })
}

// this functions picks the last 2 chars of the browserId cookie, converts them from hexadecimal to decimal
// and with that value returns a value from 0 to 100
// the same bid will always get the same return
const calculateBucket = bid => Math.round(parseInt(bid.substring(bid.length - 2), 16) / 255 * 100)

// calculates the bucket based on the browserId cookie
const evaluateBucket = (criteria, req, options) => {
  if (!options.bucket) { options.bucket = calculateBucket(req.bid) }
  return options.bucket >= criteria.min && options.bucket <= criteria.max
}

// TODO: decide if cookies will be an array instead of an object
const evaluateCookie = (criteria, req) => {
  if (!req.cookies || !req.cookies[criteria.name]) { return false }
  return req.cookies[criteria.name] === criteria.value
}

const evaluteUserAgent = (criteria, req) => {
  if (!req.headers || !req.headers['user-agent']) { return false }
  return criteria.some(agent => req.headers['user-agent'].match(agent))
}

const getGeoIp = req => {
  const lookup = geoipLite.lookup(
    (req.params && req.params.splitterIP) ||
    req.headers['X-Forwarded-For'] || // to allow proxies
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    (req.connection.socket && req.connection.socket.remoteAddress) // only this one will work on https
  )
  return lookup ? [lookup.country, lookup.region, lookup.city].join('.') : NOT_FOUND
}

const evaluateGeoip = (criteria, req, options) => {
  if (!options.geo) { options.geo = getGeoIp(req) }
  if (options.geo === NOT_FOUND) { return false }
  return criteria.some(g => {
    if (options.geo === g) { return true }
    if (g[g.length - 1] !== '.') { return false }
    return options.geo.split('.')[0] === g.split('.')[0]
  })
}

const evaluateDeviceDevice = (mobileDetect, {device}) => {
  if (!device) { return true }
  switch (device) {
    case 'desktop': return !mobileDetect.mobile()
    case 'phone':
    case 'tablet':
    case 'mobile': return !!mobileDetect[device]()
    default: return true
  }
}

const evaluateDeviceBrowserAndVersion = (mobileDetect, {browser, version}) => {
  if (!browser) { return true }

  const currentVersion = mobileDetect.version(browser)
  if (!currentVersion) { return false }

  version.from = version.from || 0
  version.to = version.to || Infinity

  return currentVersion >= version.from && currentVersion <= version.to
}

const evaluateDevice = (criteria, req, options) => {
  if (!req.headers || !req.headers['user-agent']) { return false }
  if (!options.device) { options.device = new MobileDetect(req.headers['user-agent']) }
  return criteria.some(d => [evaluateDeviceDevice, evaluateDeviceBrowserAndVersion].every(fn => fn(options.device, d)))
}

const evaluateVisitor = (criteria, req, options) => {
  criteria = !!criteria
  if (!req.cookies) { return criteria }
  return Object.keys(req.cookies).length === 0 ? criteria : !criteria
}

const splitterRules = {
  host: evaluateHost,
  path: evaluatePath,
  bucket: evaluateBucket,
  cookie: evaluateCookie,
  agent: evaluteUserAgent,
  geoip: evaluateGeoip,
  device: evaluateDevice,
  visitor: evaluateVisitor
}
