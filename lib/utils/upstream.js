const rules = require('./rules')

const determineUpstream = ({rulesets, upstreams}, eventEmitter, userRules, log) => (req, res, next) => {
  const startTime = new Date().getTime()
  const options = {
    bucket: undefined,
    geo: undefined,
    device: undefined
  }

  const setUpStream = (upstream, options) => {
    req.upstream = upstream
    req.geo = options.geo
    req.bucket = options.bucket
    req.device = options.device
  }

  const rulesetsEvaluated = {}
  const evaluateRuleset = (setName) => {
    if (!rulesets[setName]) {
      log.warn(`Ruleset with name '${setName}' not found. Ruleset ignored.`)
      return true // ignore ruleset
    }

    if (!rulesetsEvaluated[setName]) {
      rulesetsEvaluated[setName] = rules.evaluateRules(rulesets[setName], req, options, userRules, log)
    }

    return rulesetsEvaluated[setName]
  }

  upstreams.some(upstream => {
    // then check if criteria.out matches
    // if it does there is no need to check the optin rules
    // check only rules match if criteria.out isn't undefined because evaluateRules will return true if no rules are set
    if (upstream.criteria.out && rules.evaluateRules(upstream.criteria.out, req, options, userRules, log)) {
      return false
    }

    if (rules.evaluateRules(upstream.criteria.in, req, options, userRules, log)) {
      setUpStream(upstream, options)
      return true
    }

    return false
  })

  if (req.upstream) {
    eventEmitter.emit('rulesProcessing', new Date().getTime() - startTime, req.upstream.name)
  }

  next()
}

module.exports = { determineUpstream }
