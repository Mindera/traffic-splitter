'use strict'

const restify = require('restify')
const Agent = require('agentkeepalive')

const cors = require('./cors')
const splitterExecutors = require('./executors')

module.exports = {
  pipe: (config, eventEmitter, customExecutors, log) => {
    const httpAgent = new Agent(config.api.upstreamKeepAlive)
    const httpsAgent = new Agent.HttpsAgent(config.api.upstreamKeepAlive)

    const executors = splitterExecutors(httpAgent, httpsAgent)
    const finalExecutors = Object.assign({}, executors, customExecutors)

    const bidCookieDetails = {
      domain: '',
      path: '/',
      maxAge: config.browserId.maxAge || (60 * 60 * 1000)
    }
    let interval

    // emit httpAgent metrics event only if there is at least one serve upstream type
    if (config.upstreams.some(upstream => upstream.upstream.type === 'serve')) {
      interval = (config.api.emitMetricsInterval && config.api.emitMetricsInterval.http) || 5000
      setInterval(() => { eventEmitter.emit('httpSocketMetrics', httpAgent.getCurrentStatus()) }, interval)
    }

    // emit httpsAgent metrics event only if there is at least one serveSecure upstream type
    if (config.upstreams.some(upstream => upstream.upstream.type === 'serveSecure')) {
      interval = (config.api.emitMetricsInterval && config.api.emitMetricsInterval.https) || 5000
      setInterval(() => { eventEmitter.emit('httpsSocketMetrics', httpsAgent.getCurrentStatus()) }, interval)
    }

    return (req, res, next) => {
      const originIndex = cors.getIndexOfOrigin(req.headers || {}, config)
      bidCookieDetails.domain = originIndex >= 0 ? config.CORS.domains[originIndex] : ''

      if (!req.upstream || !req.upstream.upstream || !req.upstream.upstream.type) {
        eventEmitter.emit('noUpstreamFound', req)
        return next(new restify.InternalError('No upstream'))
      }

      try {
        const executor = finalExecutors[req.upstream.upstream.type]

        executor(req, res, next, {
          config,
          eventEmitter,
          log,
          bidCookieDetails
        })
      } catch (e) {
        eventEmitter.emit('upstreamException', e, req.upstream)
        log.error({ message: `Exception piping request: ${e}` })
        return next(new restify.InternalError('Internal Server Error'))
      }
    }
  }
}
