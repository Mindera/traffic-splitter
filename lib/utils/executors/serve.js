const http = require('http')
const https = require('https')
const restify = require('restify')
const cors = require('../cors')
const helper = require('./helper')

module.exports = (req, res, next, {config, eventEmitter, log, bidCookieDetails, httpAgent, httpsAgent}) => {
  const upstream = req.upstream.upstream
  const options = {
    hostname: upstream.options.host,
    port: upstream.options.port,
    method: req.method,
    path: req.url,
    headers: Object.assign(req.headers, upstream.options.headers),
    agent: undefined
  }
  let cookiesDownstream = {}

  // apply a path rewrite
  if (upstream.options.rewrite) {
    options.path = options.path.replace(upstream.options.rewrite.regExp, upstream.options.rewrite.to)
  }

  // emit browser identifier cookie
  if (req.emitBid) {
    bidCookieDetails.value = req.bid
    cookiesDownstream[config.browserId.cookie] = bidCookieDetails
  }

  // cookies defined in the upstream configuration will be attached both to the upstream headers and to the downstream
  if (upstream.options.cookies) {
    cookiesDownstream = Object.assign(cookiesDownstream, upstream.options.cookies)

    options.headers.cookie = [
      ...options.headers.cookie ? options.headers.cookie.split('; ') : [],
      ...Object.keys(cookiesDownstream).map(prop => prop + '=' + cookiesDownstream[prop].value)
    ].join('; ')
  }

  let proxy
  if (upstream.type === 'serveSecure') {
    options.agent = httpsAgent
    proxy = https.request(options)
  } else {
    options.agent = httpAgent
    proxy = http.request(options)
  }

  proxy.setTimeout(upstream.options.timeout || 60000)

  proxy.on('response', (proxyRes) => {
    let headers = {}
    if (proxyRes.headers) { headers = proxyRes.headers }

    // emit cookies
    headers['set-cookie'] = [
      ...(proxyRes.headers && proxyRes.headers['set-cookie']) || [],
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

    res.writeHead(proxyRes.statusCode, headers)

    eventEmitter.emit('serving', proxyRes.statusCode, req.upstream, new Date().getTime() - req.startTime, req.headers && req.headers.host)
    proxyRes.pipe(res, { end: true })
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

    eventEmitter.emit('servingError', err, req.upstream, new Date().getTime() - req.startTime)
    return next(new restify.InternalError('Piping error: ' + err))
  })

  req.pipe(proxy, { end: true })
}
