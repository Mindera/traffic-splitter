const rules = require('./rules')

const determineUpstream = ({upstreams}, eventEmitter, userRules, log) => {
  return (req, res, next) => {
    const startTime = new Date().getTime()

    const options = {
      bucket: undefined,
      geo: undefined,
      device: undefined
    }

    upstreams.some(upstream => {
      // First check if criteria.out matches
      // if yes return false, if not continue to evaluate criteria.in rules
      if (upstream.criteria.out && rules.evaluateRules(upstream.criteria.out, req, options, userRules, log).match) {
        console.log('dei match no criteria out.. next upstream plz!')
        return false
      }

      if (upstream.criteria.in) {
        rules.evaluateRules(upstream.criteria.in, req, options, userRules, log)
      }

      return false
    })

    if (req.upstream) {
      eventEmitter.emit('rulesProcessing', new Date().getTime() - startTime, req.upstream.name)
    } else {
      eventEmitter.emit('noUpstreamFound', req)
    }

    next()
  }
}

module.exports = { determineUpstream }
