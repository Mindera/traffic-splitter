const geoipLite = require('geoip-lite')
const MobileDetect = require('mobile-detect')
const NOT_FOUND = 'NOT_FOUND'
const ignore = ['and', 'AND', 'or', 'OR']

const evaluateRules = (criteria, req, options, userRules, log) => {
  const final = {
    match: undefined,
    numRules: 0,
    rulesMatched: 0
  }

  Object.keys(criteria).forEach(key => {
    // handle operators AND and OR after the forEach
    if (ignore.indexOf(key) >= 0) { return }

    // first search for the key in userRules - this allows user to override splitterRules
    if (userRules[key]) {
      final.numRules++
      const result = userRules[key](criteria[key], req)
      if (typeof result !== 'boolean') {
        final.numRules--
        log.warn(`Custom rule '${key}' ignored! It returned ${result} when it should've returned true or false.`)
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

  // handle operators AND and OR in here

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
const evaluateBucket = (criteria, req, {bucket}) => {
  if (!bucket) { bucket = calculateBucket(req.bid) }
  return bucket >= criteria.min && bucket <= criteria.max
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

const evaluateGeoip = (criteria, req, {geo}) => {
  if (!geo) { geo = getGeoIp(req) }
  if (geo === NOT_FOUND) { return false }
  return criteria.some(g => {
    if (geo === g) { return true }
    if (g[g.length - 1] !== '.') { return false }
    return geo.split('.')[0] === g.split('.')[0]
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

const evaluateDevice = (criteria, req, {device}) => {
  if (!req.headers || !req.headers['user-agent']) { return false }
  if (!device) { device = new MobileDetect(req.headers['user-agent']) }
  return criteria.some(d => [evaluateDeviceDevice, evaluateDeviceBrowserAndVersion].every(fn => fn(device, d)))
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
