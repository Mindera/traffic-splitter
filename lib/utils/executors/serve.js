const http = require('http')
const https = require('https')
const restify = require('restify')
const cors = require('../cors')

module.exports = (req, res, next, {config, eventEmitter, log, bidCookieDetails}) => {
  const upstream = req.upstream.upstream
  const options = {
    hostname: upstream.options.host,
    port: upstream.options.port,
    method: req.method,
    path: (upstream.options.path_prefix || '') + req.url,
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

  const proxy = upstream.type === 'serveHTTPS'
    ? https.request(options)
    : http.request(options)

  proxy.setTimeout(upstream.options.timeout || 60000)

  proxy.on('response', (proxyRes) => {
    // emit cookies
    if (!proxyRes.headers) { proxyRes.headers = {} }
    proxyRes.headers['set-cookie'] = [
      ...proxyRes.headers['set-cookie'] || [],
      ...Object.keys(cookiesDownstream).map(prop => buildCookieString(prop, cookiesDownstream[prop]))
    ]

    if (req.params && req.params.splitterDebug) {
      proxyRes.headers['x-splitter-upstream'] = JSON.stringify(req.upstream.name);
      ['geo', 'device', 'bucket'].forEach(prop => {
        if (!req[prop]) { return }
        proxyRes.headers['x-splitter-' + prop] = JSON.stringify(req[prop])
      })
    }

    res.writeHead(proxyRes.statusCode, proxyRes.headers)
    eventEmitter.emit('serving', proxyRes.statusCode, req.upstream, new Date().getTime() - req.startTime)
    proxyRes.pipe(res, { end: true })
  })

  proxy.on('error', (err) => {
    log.error({
      message: `Serving error: ${req.url} [${err}]`,
      upstream: {
        name: req.upstream.name
      },
      request: {
        url: req.url,
        headers: req.headers
      }
    })

    eventEmitter.emit('servingError', err, req.upstreamm, new Date().getTime() - req.startTime)
    return next(new restify.InternalError('Piping error: ' + err))
  })

  req.pipe(proxy, { end: true })
}

const buildCookieString = (name, cookie) => name + '=' + cookie.value +
  ';domain=' + (cookie.domain || '') +
  ';path=' + (cookie.path || '') +
  ';expires=' + (new Date(new Date().getTime() + (cookie.maxAge * 1000)).toGMTString()) +
  ';max-age=' + (cookie.maxAge || '')
