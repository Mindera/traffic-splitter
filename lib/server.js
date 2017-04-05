const restify = require('restify')
const cookieParser = require('restify-cookies')
const clone = require('clone')
const {bid, cors, upstream} = require('./utils')

function Server (eventEmitter, config, log, bootstrapMiddlewares, requestMiddlewares, rules) {
  this.start = () => {
    const server = createServer(config)
    // missing apply default configs
    loadBootstrapMiddlewares(server, config, bootstrapMiddlewares)
    setStartTimeOnRequest(server)
    setServerMaxConnections(server, config)
    loadRequestMiddlewares(server, config, requestMiddlewares)
    loadRestifyMiddlewares(server)
    server.use(bid.extractBrowserId(config.browserId))
    server.use(upstream.determineUpstream(config, eventEmitter))
    // missing circuitBreaker
    handleReqFinish(server, eventEmitter, log)
    // missing load spies
    createHealthCheckEndpoint(server)
    cors.setServerOptions(server, config.CORS)
    startServer(server, config, log, eventEmitter)
  }
}

exports = module.exports = Server

const createServer = config => restify.createServer({
  name: config.api.serverName || 'Traffic Splitter'
})

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

const setServerMaxConnections = (server, config) => {
  server.server.maxConnections = config.api.maxConnections || 256
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
  // server.pre(restify.fullResponse())
  server.use(restify.queryParser())
  server.use(cookieParser.parse)
}

const handleReqFinish = (server, eventEmitter, log) => {
  server.use((req, res, next) => {
    res.on('finish', () => {
      const duration = new Date().getTime() - req.startTime
      eventEmitter.emit('resFinish', req, res, duration)

      if (res.statusCode && res.statusCode >= 400) {
        log.error({
          message: 'Upstream responded with Error: ' + req.url,
          statusCode: res.statusCode,
          upstream: {
            // name: req.upstream.name // uncomment after making this object available
          },
          request: {
            url: req.url,
            responseTime: duration,
            headers: req.headers
          }
        })
      }

      // TODO: log information about this request if it took too long to execute
    })
    next()
  })
}

const createHealthCheckEndpoint = server => {
  server.get('/healthcheck', (req, res, next) => {
    res.send({ status: 'OK' })
    return next()
  })
}

const startServer = (server, config, log, eventEmitter) => {
  server.listen(config.api.port, () => {
    log.info(server.name + ' listening at ' + server.url)
    eventEmitter.emit('serverStart')
  })
}
