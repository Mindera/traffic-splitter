const evaluateRules = (criteria, req, options, userRules) => {
  // console.log(criteria)
  Object.keys(criteria).forEach(key => {
    if (predefinedRules[key]) {
      predefinedRules[key](criteria[key], req, options)
    } else {
      // handle operators AND and OR after the forEach
      // search for key in userRules
      if (key !== 'and' && key !== 'or' && userRules[key]) {
        userRules[key](criteria[key], req)
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
  console.log(criteria)
}

const evaluatePath = (criteria, req, options) => {
  console.log(criteria)
}

const evaluateBucket = (criteria, req, options) => {
  console.log(criteria)
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
