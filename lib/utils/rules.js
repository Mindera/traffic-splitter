const evaluateRules = (criteria, req, options, userRules) => {
  Object.keys(criteria).forEach(key => {
    if (predefinedRules[key]) {
      if (key === 'bucket') { // just for testing each rule individually
        const result = predefinedRules[key](criteria[key], req, options)
        if (result !== undefined) { console.log('Resultado: ', result) }
      }
    } else {
      // handle operators AND and OR after the forEach
      // search for key in userRules
      if (key !== 'and' && key !== 'or' && userRules[key]) {
        // userRules[key](criteria[key], req)
      }
    }
  })

  // handle operators AND and OR in here

  return {
    match: false
  }
}

module.exports = { evaluateRules }

const evaluateHost = (criteria, req, options) => {
  if (!req.headers || !req.headers.host) { return false }
  return criteria.indexOf(req.headers.host) >= 0
}

const evaluatePath = (criteria, req, options) => {
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

// this functions picks the last 2 digits of the browserId cookie, converts them from hexadecimal to decimal
// and with that value returns a value from 0 to 100
// the same bid will always get the same return
const calculateBucket = bid => Math.round(parseInt(bid.substring(bid.length - 2), 16) / 255 * 100)

const evaluateBucket = (criteria, req, {bucket}) => {
  if (!bucket) { bucket = calculateBucket(req.bid) }
  return bucket >= criteria.min && bucket <= criteria.max
}

const evaluateCookie = (criteria, req, options) => {
  console.log(criteria)
}

const evaluteUserAgent = (criteria, req, options) => {
  console.log(criteria)
}

const evaluateGeoip = (criteria, req, options) => {
  console.log(criteria)
}

const evaluateDevice = (criteria, req, options) => {
  console.log(criteria)
}

const evaluateVisitor = (criteria, req, options) => {
  console.log(criteria)
}

const predefinedRules = {
  host: evaluateHost,
  path: evaluatePath,
  bucket: evaluateBucket,
  cookie: evaluateCookie,
  agent: evaluteUserAgent,
  geoip: evaluateGeoip,
  device: evaluateDevice,
  visitor: evaluateVisitor
}
