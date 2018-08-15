'use strict'

const restify = require('restify')

const helper = require('./helper')
const cors = require('../cors')
const { getElapsedTime } = require('../dates')

module.exports = (httpClient, httpAgent) =>
  (req, res, next, { config, eventEmitter, log, bidCookieDetails }) => {
    const upstream = req.upstream.upstream
    const upstreamReq = {
      hostname: upstream.options.host,
      port: upstream.options.port,
      method: req.method,
      path: req.url,
      headers: Object.assign(req.headers, upstream.options.headers),
      agent: httpAgent
    }
    let cookiesDownstream = {}

    // apply a path rewrite
    if (upstream.options.rewrite) {
      upstreamReq.path = upstreamReq.path.replace(upstream.options.rewrite.regExp, upstream.options.rewrite.to)
    }

    // emit browser identifier cookie
    if (req.emitBid) {
      bidCookieDetails.value = req.bid
      cookiesDownstream[config.browserId.cookie] = bidCookieDetails
    }

    // cookies defined in the upstream configuration will be attached both to the upstream headers and to the downstream
    if (upstream.options.cookies) {
      cookiesDownstream = Object.assign(cookiesDownstream, upstream.options.cookies)

      upstreamReq.headers.cookie = [
        ...upstreamReq.headers.cookie ? upstreamReq.headers.cookie.split('; ') : [],
        ...Object.keys(cookiesDownstream).map(prop => prop + '=' + cookiesDownstream[prop].value)
      ].join('; ')
    }

    const proxy = httpClient.request(upstreamReq)

    proxy.setTimeout(upstream.options.timeout || 60000)

    proxy.on('response', (upstreamRes) => {
      let headers = {}
      if (upstreamRes.headers) { headers = upstreamRes.headers }

      // emit cookies
      headers['set-cookie'] = [
        ...(upstreamRes.headers && upstreamRes.headers['set-cookie']) || [],
        ...Object.keys(cookiesDownstream).map(prop => helper.buildCookieString(prop, cookiesDownstream[prop]))
      ]

      // send debug information
      if (req.params && req.params.splitterDebug) {
        headers['x-splitter-upstream'] = JSON.stringify(req.upstream.name);
        ['geo', 'device', 'bucket'].forEach(prop => {
          if (!req[prop]) { return }
          headers['x-splitter-' + prop] = JSON.stringify(req[prop])
        })
      }

      // if request host is part of the domains in the config, set CORS headers
      if (cors.getIndexOfOrigin(req.headers || {}, config) >= 0) {
        headers = Object.keys(headers)
          .filter(key => cors.getHeadersNames().indexOf(key) < 0)
          .reduce((obj, key) => {
            obj[key] = headers[key]
            return obj
          }, {})

        headers = Object.assign(headers, cors.getHeaders(req.headers, config))
      }

      res.writeHead(upstreamRes.statusCode, headers)

      const duration = getElapsedTime(req.startTime)
      const host = req.headers && req.headers.host
      eventEmitter.emit('serving', upstreamRes.statusCode, req.upstream, duration, host, upstreamReq, upstreamRes)

      upstreamRes.pipe(res, { end: true })
    })

    proxy.on('error', (err) => {
      log.error({
        message: `Serving error - ${req.url}: [${err}]`,
        upstream: {
          name: req.upstream.name
        },
        request: {
          url: req.url,
          headers: req.headers
        }
      })

      const duration = getElapsedTime(req.startTime)
      eventEmitter.emit('servingError', err, req.upstream, duration, upstreamReq)

      return next(new restify.InternalError('Piping error: ' + err))
    })

    req.pipe(proxy, { end: true })
  }
