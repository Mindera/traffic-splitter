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

const getOptimizedCriteria = ({pathRegExp, rulesets, criteria}) => {
  if (!criteria || Object.keys(criteria).length === 0) { return }

  const geoip = optimizeGeoIpLocation(criteria)
  if (geoip) { criteria.geoip = geoip }

  const agent = optimizeUserAgent(criteria)
  if (agent) { criteria.agent = agent }

  const path = optimizePath(criteria, pathRegExp)
  if (path) { criteria.path = path }

  if (criteria.ruleset) {
    criteria = Object.assign(
      criteria,
      criteria.ruleset.reduce((prev, set) =>
        Object.assign(prev, rulesets[set])
      , {})
    )

    delete criteria.ruleset
  }

  ['and', 'or'].forEach(operator => {
    if (criteria[operator]) {
      const optimizedOperator = getOptimizedCriteria({
        pathRegExp,
        rulesets,
        criteria: criteria[operator].reduce((prev, cur) => Object.assign(prev, cur), {}) // convert array to object
      })

      criteria[operator] = Object.keys(optimizedOperator).map(key => ({[key]: optimizedOperator[key]})) // convert object to array
    }
  })

  return criteria
}

const getOptimizedUpstreams = ({pathRegExp, rulesets, upstreams}) => {
  rulesets = rulesets || {}
  if (pathRegExp) {
    pathRegExp.prefix = pathRegExp.prefix || ''
    pathRegExp.sufix = pathRegExp.sufix || ''
  }

  return upstreams.map(upstream => {
    if (!upstream.upstream) { return }

    if (upstream.upstream.options && upstream.upstream.options.rewrite) {
      upstream.upstream.options.rewrite.regExp = new RegExp(upstream.upstream.options.rewrite.expression || '')
    }

    ['in', 'out'].forEach(key => { upstream.criteria[key] = getOptimizedCriteria({pathRegExp, rulesets, criteria: upstream.criteria[key]}) })

    return upstream
  })
}

const getPerformance = ({performance}) => {
  performance = performance || {}
  performance.logSlowRequests = performance.logSlowRequests === undefined ? true : performance.logSlowRequests
  performance.slowRequestThreshold = performance.slowRequestThreshold || 1000

  return performance
}

module.exports = {
  validate,
  getOptimizedUpstreams,
  getPerformance
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
