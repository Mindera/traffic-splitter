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

  return res.send({ success: true, status: 'PIPE', options })
}
