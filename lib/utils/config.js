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

const getOptimizedCriteria = ({pathRegExp, rulesets}, criteria) => {
  if (!criteria || Object.keys(criteria).length === 0) { return }

  const criteriaWithRulesetsApplied = criteria.ruleset
    ? Object.assign(
      criteria.ruleset.reduce((prev, set) => Object.assign(prev, rulesets[set]), {}),
      criteria
    )
    : Object.assign({}, criteria)

  const criteriaWithoutRulesetProperty = Object.keys(criteriaWithRulesetsApplied).reduce((obj, key) => {
    if (key !== 'ruleset') { obj[key] = criteriaWithRulesetsApplied[key] }
    return obj
  }, {})

  const geoip = optimizeGeoIpLocation(criteriaWithoutRulesetProperty)
  const agent = optimizeUserAgent(criteriaWithoutRulesetProperty)
  const path = optimizePath(criteriaWithoutRulesetProperty, pathRegExp)

  const criteriaWithPropertiesOptimized = Object.assign(
    {},
    criteriaWithoutRulesetProperty,
    geoip ? {geoip} : {},
    agent ? {agent} : {},
    path ? {path} : {}
  )

  const operatorsHandled = ['and', 'or'].reduce((obj, op) => {
    if (criteriaWithPropertiesOptimized[op]) {
      const optimizedOperator = getOptimizedCriteria({
        pathRegExp,
        rulesets
      },
        criteriaWithPropertiesOptimized[op].reduce((prev, cur) => Object.assign(prev, cur), {}) // convert array to object
      )

      obj[op] = Object.keys(optimizedOperator).map(key => ({[key]: optimizedOperator[key]})) // convert object to array
    }

    return obj
  }, {})

  const criteriaWithOperatorsHandled = Object.assign(
    {},
    criteriaWithPropertiesOptimized,
    operatorsHandled
  )

  return criteriaWithOperatorsHandled
}

const getOptimizedUpstreams = ({pathRegExp, rulesets, upstreams}) => {
  rulesets = rulesets || {}
  if (pathRegExp) {
    pathRegExp.prefix = pathRegExp.prefix || ''
    pathRegExp.sufix = pathRegExp.sufix || ''
  }

  return upstreams.filter(upstream =>
    upstream.enabled &&
    upstream.upstream && upstream.upstream.type && upstream.upstream.options &&
    (upstream.upstream.options.host || upstream.upstream.options.hosts || upstream.upstream.options.location)
  ).map(upstream => {
    const rewrite = upstream.upstream.options.rewrite
      ? Object.assign(
        {},
        upstream.upstream.options.rewrite,
        {
          regExp: new RegExp(upstream.upstream.options.rewrite.expression || ''),
          to: upstream.upstream.options.rewrite.to || ''
        }
      )
      : undefined

    return Object.assign(
      {
        enabled: true
      },
      upstream,
      {
        upstream: Object.assign(
          {},
          upstream.upstream,
          {
            options: Object.assign(
              {},
              upstream.upstream.options,
              rewrite ? {rewrite} : {}
            )
          }
        )
      },
      {
        criteria: {
          in: getOptimizedCriteria({pathRegExp, rulesets}, (upstream.criteria && upstream.criteria.in) || {}),
          out: getOptimizedCriteria({pathRegExp, rulesets}, (upstream.criteria && upstream.criteria.out) || {})
        }
      }
    )
  })
}

const getPerformance = ({performance}) => {
  return performance
    ? {
      logSlowRequests: performance.logSlowRequests === undefined ? true : performance.logSlowRequests,
      slowRequestThreshold: performance.slowRequestThreshold || 1000
    } : {
      logSlowRequests: true,
      slowRequestThreshold: 1000
    }
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
