const rules = require('./rules')

const determineUpstream = ({upstreams}, eventEmitter, userRules, log) => (req, res, next) => {
  const startTime = new Date().getTime()
  let maxRulesMatched = -1

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

  upstreams.some(upstream => {
    if (!upstream.enabled) { return false }

    // First check if criteria.out matches
    // if it does there is no need to check the optin rules
    if (upstream.criteria.out && rules.evaluateRules(upstream.criteria.out, req, options, userRules, log).match) {
      return false
    }

    const result = rules.evaluateRules(upstream.criteria.in, req, options, userRules, log)
    if (result.match) {
      if (upstream.priority) {
        setUpStream(upstream, options)
        return true
      }
      if (result.rulesMatched > maxRulesMatched) {
        maxRulesMatched = result.rulesMatched
        setUpStream(upstream, options)
      }
    }

    return false
  })

  if (req.upstream) {
    eventEmitter.emit('rulesProcessing', new Date().getTime() - startTime, req.upstream.name)
  }

  next()
}

module.exports = { determineUpstream }
