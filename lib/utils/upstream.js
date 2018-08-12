'use strict'

const rules = require('./rules')
const { getElapsedTime } = require('./dates')

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

    if (rulesetsEvaluated[setName] === undefined) {
      rulesetsEvaluated[setName] = rules.evaluateRules(rulesets[setName], req, options, userRules, log)
    }

    return rulesetsEvaluated[setName]
  }

  upstreams.some(upstream => {
    const setsMatched = {
      in: true,
      out: true
    }

    // first handle rulesets, execute each set only once per request
    if (upstream.criteria.out && upstream.criteria.out.ruleset) {
      setsMatched.out = upstream.criteria.out.ruleset.some(set => evaluateRuleset(set))
    }

    if (upstream.criteria.in && upstream.criteria.in.ruleset) {
      setsMatched.in = upstream.criteria.in.ruleset.some(set => evaluateRuleset(set))
    }

    // then check if criteria.out matches
    // if it does there is no need to check the optin rules
    // check only rules match if criteria.out isn't undefined because evaluateRules will return true if no rules are set
    if (setsMatched.out && upstream.criteria.out && rules.evaluateRules(upstream.criteria.out, req, options, userRules, log)) {
      return false
    }

    if (setsMatched.in && rules.evaluateRules(upstream.criteria.in, req, options, userRules, log)) {
      setUpStream(upstream, options)
      return true
    }

    return false
  })

  if (req.upstream) {
    const duration = getElapsedTime(startTime)
    eventEmitter.emit('rulesProcessing', duration, req.upstream.name)
  }

  next()
}

module.exports = { determineUpstream }
