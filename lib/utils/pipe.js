const restify = require('restify')
const execute = require('./executors')
const cors = require('./cors')
const Agent = require('agentkeepalive')

module.exports = {
  pipe: (config, eventEmitter, log) => {
    const bidCookieDetails = {
      domain: '',
      path: '/',
      maxAge: config.browserId.maxAge || (60 * 60 * 1000)
    }

    const httpAgent = new Agent(config.api.upstreamKeepAlive)
    let interval = (config.api.emitMetricsInterval && config.api.emitMetricsInterval.http) || 5000
    setInterval(() => { eventEmitter.emit('httpSocketMetrics', httpAgent.getCurrentStatus()) }, interval)

    const httpsAgent = new Agent.HttpsAgent(config.api.upstreamKeepAlive)
    // TODO: emit this only if HTTPS is being used
    interval = (config.api.emitMetricsInterval && config.api.emitMetricsInterval.https) || 5000
    setInterval(() => { eventEmitter.emit('httpsSocketMetrics', httpsAgent.getCurrentStatus()) }, interval)

    return (req, res, next) => {
      const originIndex = cors.getIndexOfOrigin(req.headers || {}, config)
      bidCookieDetails.domain = originIndex >= 0 ? config.CORS.domains[originIndex] : ''

      if (!req.upstream || !req.upstream.upstream || !req.upstream.upstream.type) {
        eventEmitter.emit('noUpstreamFound', req)
        return next(new restify.InternalError('No upstream'))
      }

      // try {
        execute[req.upstream.upstream.type](req, res, next, {
          config,
          eventEmitter,
          log,
          bidCookieDetails,
          httpAgent,
          httpsAgent
        })
      // } catch (e) {
      //   eventEmitter.emit('upstreamException', e, req.upstream)
      //   log.error({ message: `Exception piping request: ${e}` })
      //   return next(new restify.InternalError('Internal Server Error'))
      // }
    }
  }
}
