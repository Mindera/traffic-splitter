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

// TODO: avoid mutation and instead return a new upstreams object
const optimizeUpstreams = ({pathRegExp, rulesets, upstreams}) => {
  if (!rulesets) { rulesets = {} }
  if (pathRegExp) {
    if (!pathRegExp.prefix) { pathRegExp.prefix = '' }
    if (!pathRegExp.sufix) { pathRegExp.sufix = '' }
  }

  const keys = ['in', 'out']

  upstreams.forEach(upstream => {
    keys.forEach(key => {
      if (upstream.criteria[key]) {
        let optimizedCriteria
        if (Object.keys(upstream.criteria[key]).length > 0) {
          optimizedCriteria = upstream.criteria[key]

          const geoip = optimizeGeoIpLocation(optimizedCriteria)
          if (geoip) { optimizedCriteria.geoip = geoip }

          const agent = optimizeUserAgent(optimizedCriteria)
          if (agent) { optimizedCriteria.agent = agent }

          const path = optimizePath(optimizedCriteria, pathRegExp)
          if (path) { optimizedCriteria.path = path }

          if (optimizedCriteria.ruleset) {
            optimizedCriteria = Object.assign(
              optimizedCriteria,
              optimizedCriteria.ruleset.reduce((prev, set) =>
                Object.assign(prev, rulesets[set])
              , {})
            )

            delete optimizedCriteria.ruleset
          }
        }
        upstream.criteria[key] = optimizedCriteria
      }
    })

    if (!upstream.upstream.options) { upstream.upstream.options = {} }
    if (upstream.upstream.options.rewrite) { upstream.upstream.options.rewrite.regExp = new RegExp(upstream.upstream.options.rewrite.expression) }
  })
}

module.exports = {
  validate,
  optimizeUpstreams
}

const optimizeGeoIpLocation = ({geoip}) => {
  if (!geoip || !Array.isArray(geoip)) { return }
  return geoip.map(g => [g.country, g.region, g.city].join('.'))
}

const optimizeUserAgent = ({agent}) => {
  if (!agent || !Array.isArray(agent)) { return }
  return agent.map(a => new RegExp(a, 'gi'))
}

const optimizePath = ({path}, pathRegExp) => {
  if (!path || !Array.isArray(path)) { return }
  return path.map(p => {
    if (pathRegExp) { p = pathRegExp.prefix + p + pathRegExp.sufix }
    return new RegExp(p, 'i')
  })
}
