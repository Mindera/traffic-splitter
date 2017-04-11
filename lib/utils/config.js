// TODO: improve this method in order to the entire configuration be validated
const validate = config => {
  if (!config) { return false }

  const requiredProperties = [
    'api',
    'CORS',
    'browserId',
    'circuitBreaker',
    'upstreams',
    'bunyan'
  ]

  return requiredProperties.every(property => config.hasOwnProperty(property))
}

const optimizeCriteria = upstreams => {
  const keys = ['in', 'out']

  upstreams.forEach(upstream => {
    keys.forEach(key => {
      if (upstream.criteria[key]) {
        if (Object.keys(upstream.criteria[key]).length !== 0) {
          otimizeGeoIpLocation(upstream.criteria[key])
          otimizeUserAgent(upstream.criteria[key])
        } else {
          // delete criteria since it has no objects in order to avoid conflicts when evaluating rules
          delete upstream.criteria[key]
        }
      }
    })
  })
}

module.exports = {
  validate,
  optimizeCriteria
}

const otimizeGeoIpLocation = criteria => {
  if (!criteria.geoip || !Array.isArray(criteria.geoip)) { return }
  criteria.geoip = criteria.geoip.map(g => [g.country, g.region, g.city].join('.'))
}

const otimizeUserAgent = criteria => {
  if (!criteria.agent || !Array.isArray(criteria.agent)) { return }
  criteria.agent = criteria.agent.map(a => new RegExp(a, 'gi'))
}
