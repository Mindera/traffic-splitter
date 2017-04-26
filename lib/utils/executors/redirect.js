const helper = require('./helper')

module.exports = (req, res, next, {config, eventEmitter, log, bidCookieDetails}) => {
  const upstream = req.upstream.upstream

  // cookies defined in the upstream configuration will be attached to the headers that will be sent upstream
  if (upstream.options.cookies) {
    Object.keys(upstream.options.cookies).forEach(key => {
      res.setCookie(key, upstream.options.cookies[key].value, helper.buildCookieObject(upstream.options.cookies[key]))
    })
  }

  // emit browser identifier cookie
  if (req.emitBid) {
    res.setCookie(config.browserId.cookie, req.bid, helper.buildCookieObject(bidCookieDetails))
  }

  // send debug information
  if (req.params && req.params.splitterDebug) {
    res.header('x-splitter-upstream', JSON.stringify(req.upstream.name));
    ['geo', 'device', 'bucket'].forEach(prop => {
      if (!req[prop]) { return }
      res.header('x-splitter-' + prop, JSON.stringify(req[prop]))
    })
  }

  eventEmitter.emit('redirecting', upstream.options.statusCode, req.upstream, new Date().getTime() - req.startTime)
  res.redirect(upstream.options.statusCode, upstream.options.location, next)
}
