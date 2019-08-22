'use strict'

const clone = require('clone')
const restify = require('restify')
const cookieParser = require('restify-cookies')

const { bid, cors, upstream, pipe, dates } = require('./utils')

const { getElapsedTime } = dates

module.exports = Server

function Server (config, eventEmitter, bootstrapMiddlewares, requestMiddlewares, rules, executors, logger) {
  this.start = () => {
    const server = createServer(config)

    // options and healthcheck must be before the middlewares
    setServerOptions(server, config)
    createHealthCheckEndpoint(server)

    loadBootstrapMiddlewares(server, config, bootstrapMiddlewares)

    setStartTimeOnRequest(server)
    setServerMaxConnections(server, config)

    loadRequestMiddlewares(server, config, requestMiddlewares)
    loadRestifyMiddlewares(server)

    server.use(bid.extractBrowserId(config))
    server.use(upstream.determineUpstream(config, eventEmitter, rules, logger))

    handleReqFinish(server, config, eventEmitter, logger)
    configureListeners(server, config, eventEmitter, executors, logger)
    startServer(server, config, eventEmitter, logger)
  }
}

const createServer = ({api}) => restify.createServer({
  name: api.serverName || 'Traffic Splitter'
})

const setServerOptions = (server, config) => {
  if (config.domains && config.CORS) {
    server.opts(/.*/, (req, res, next) => {
      const headers = cors.getHeaders(req.headers || {}, config)
      Object.keys(headers).forEach(key => { res.header(key, headers[key]) })
      res.send(200)
      next()
    })
  }
}

const createHealthCheckEndpoint = server => {
  server.get('/healthcheck', (req, res, next) => res.send({ status: 'OK' }))
}

const loadBootstrapMiddlewares = (server, config, bootstrapMiddlewares) => {
  if (bootstrapMiddlewares && bootstrapMiddlewares.length) {
    const configuration = clone(config)
    bootstrapMiddlewares.forEach(bootstrapFn => { bootstrapFn(server, configuration) })
  }
}

const setStartTimeOnRequest = server => {
  server.use((req, res, next) => {
    req.startTime = new Date().getTime()
    next()
  })
}

const setServerMaxConnections = (server, {api}) => {
  server.server.maxConnections = api.maxConnections || 256
}

const loadRequestMiddlewares = (server, config, requestMiddlewares) => {
  if (requestMiddlewares && requestMiddlewares.length) {
    const configuration = clone(config)
    requestMiddlewares.forEach(requestFn => {
      server.use(requestFn(server, configuration))
    })
  }
}

const loadRestifyMiddlewares = server => {
  server.use(restify.plugins.queryParser())
  server.use(cookieParser.parse)
}

const handleReqFinish = (server, {api}, eventEmitter, logger) => {
  server.use((req, res, next) => {
    res.on('finish', () => {
      const duration = getElapsedTime(req.startTime)
      eventEmitter.emit('resFinish', req, res, duration)

      // log information about this request if response got an error
      if (res.statusCode && res.statusCode >= 400) {
        logger.error({
          message: `Upstream responded with error: ${req.url}`,
          statusCode: res.statusCode,
          upstream: {
            name: req.upstream.name
          },
          request: {
            url: req.url,
            responseTime: duration,
            headers: req.headers
          }
        })
      }

      // log slow request if it took longer to execute than the threshold defined
      if (api.performance.logSlowRequests && duration >= api.performance.slowRequestThreshold) {
        logger.warn({
          message: `Slow request detected: ${req.url}`,
          statusCode: res.statusCode,
          upstream: {
            name: req.upstream.name
          },
          request: {
            url: req.url,
            responseTime: duration,
            headers: req.headers
          }
        })
      }
    })

    next()
  })
}

const configureListeners = (server, config, eventEmitter, executors, logger) => {
  const action = pipe(config, eventEmitter, executors, logger)
  server.opts(/.*/, action)
  server.get(/.*/, action)
  server.post(/.*/, action)
  server.del(/.*/, action)
  server.put(/.*/, action)
}

const startServer = (server, {api}, eventEmitter, logger) => {
  server.listen(api.port, () => {
    logger.info(`${server.name} listening at ${server.url}`)
    eventEmitter.emit('serverStart')
  })
}
