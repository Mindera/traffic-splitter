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

const optimizeCriteria = ({upstreams}) => {
  const keys = ['in', 'out']

  upstreams.forEach(upstream => {
    keys.forEach(key => {
      if (upstream.criteria[key]) {
        let optimizedCriteria
        if (Object.keys(upstream.criteria[key]).length > 0) {
          optimizedCriteria = upstream.criteria[key]

          const geoip = otimizeGeoIpLocation(optimizedCriteria)
          if (geoip) { optimizedCriteria.geoip = geoip }

          const agent = otimizeUserAgent(optimizedCriteria)
          if (agent) { optimizedCriteria.agent = agent }
        }
        upstream.criteria[key] = optimizedCriteria
      }
    })
  })
}

module.exports = {
  validate,
  optimizeCriteria
}

const otimizeGeoIpLocation = ({geoip}) => {
  if (!geoip || !Array.isArray(geoip)) { return }
  return geoip.map(g => [g.country, g.region, g.city].join('.'))
}

const otimizeUserAgent = ({agent}) => {
  if (!agent || !Array.isArray(agent)) { return }
  return agent.map(a => new RegExp(a, 'gi'))
}
