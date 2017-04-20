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
      console.log('upstream: ', upstream.name)
      // First check if criteria.out matches
      // if yes return false, if not continue to evaluate criteria.in rules
      if (upstream.criteria.out) {
        const result = rules.evaluateRules(upstream.criteria.out, req, options, userRules, log)
        console.log('out: ', result)
        // return false
      }

      if (upstream.criteria.in) {
        const result = rules.evaluateRules(upstream.criteria.in, req, options, userRules, log)
        console.log('in: ', result)
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
