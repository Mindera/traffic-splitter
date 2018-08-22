'use strict'

const restify = require('restify')
const Agent = require('agentkeepalive')

const cors = require('./cors')
const configUtils = require('./config')
const splitterExecutors = require('./executors')

module.exports = (config, eventEmitter, customExecutors, log) => {
  const httpAgent = new Agent(config.api.upstreamKeepAlive)
  const httpsAgent = new Agent.HttpsAgent(config.api.upstreamKeepAlive)

  const executors = splitterExecutors(httpAgent, httpsAgent)
  const finalExecutors = Object.assign({}, executors, customExecutors)

  const bidCookieDetails = {
    domain: '',
    path: '/',
    maxAge: config.browserId.maxAge || (60 * 60 * 1000)
  }

  emitAgentsStatuses(config, eventEmitter, httpAgent, httpsAgent)

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

function emitAgentsStatuses (config, eventEmitter, httpAgent, httpsAgent) {
  const getIntervalForProperty = (property) => (config.api.emitMetricsInterval && config.api.emitMetricsInterval[property]) || 5000

  if (configUtils.hasAtLeastOneUpstreamOfType(config, 'serve')) {
    setInterval(() => {
      eventEmitter.emit('httpSocketMetrics', httpAgent.getCurrentStatus())
    }, getIntervalForProperty('http'))
  }

  if (configUtils.hasAtLeastOneUpstreamOfType(config, 'serveSecure')) {
    setInterval(() => {
      eventEmitter.emit('httpsSocketMetrics', httpsAgent.getCurrentStatus())
    }, getIntervalForProperty('https'))
  }
}
