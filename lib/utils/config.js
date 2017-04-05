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
  upstreams.forEach(upstream => {
    [upstream.criteria.in, upstream.criteria.out].forEach(criteria => {
      otimizeGeoIpLocation(criteria)
      otimizeUserAgent(criteria)
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
