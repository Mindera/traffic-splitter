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

  return res.send({ success: true, status: 'PIPE', options })
}
