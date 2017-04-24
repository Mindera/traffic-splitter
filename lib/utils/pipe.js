const restify = require('restify')
const execute = require('./executors')
const cors = require('./cors')

module.exports = {
  pipe: (config, eventEmitter, log) => {
    const bidCookieDetails = {
      domain: '',
      path: '/',
      maxAge: config.browserId.maxAge || (60 * 60 * 1000)
    }

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
          bidCookieDetails
        })
      // } catch (e) {
      //   eventEmitter.emit('upstreamException', req.upstream)
      //   log.error({ message: `Exception piping request: ${e}` })
      //   return next(new restify.InternalError('Internal Server Error'))
      // }
    }
  }
}
