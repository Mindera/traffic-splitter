const restify = require('restify')
const clone = require('clone')
const cookieParser = require('restify-cookies')
const bid = require('./bid')

function Server (eventEmitter, config, log, bootstrapMiddlewares, requestMiddlewares, rules) {
  this.start = () => {
    const server = createServer(config)
    // missing apply default configs
    loadBootstrapMiddlewares(server, config, bootstrapMiddlewares)
    setStartTimeOnRequest(server)
    setServerMaxConnections(server, config)
    loadRequestMiddlewares(server, config, requestMiddlewares)
    loadRestifyMiddlewares(server)
    checkBrowserIdCookie(server, config)
    // missing upstream and circuitBreaker
    handleReqFinish(server, eventEmitter, log)
    // mising load spies
    createHealthCheckEndpoint(server)
    setServerOptions(server, config)
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
  // TODO: decide which one is the pretended: pre or use
  server.pre((req, res, next) => {
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

const checkBrowserIdCookie = (server, config) => {
  server.use(bid.extractBrowserId(config.browserId))
}

const handleReqFinish = (server, eventEmitter, log) => {
  server.use((req, res, next) => {
    res.on('finish', () => {
      const duration = new Date().getTime() - req.startTime
      eventEmitter.emit('res_finish', req, res, duration)

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

const setServerOptions = (server, config) => {
  // server.opts(/.*/, (req, res, next) => {
  //   // TODO: validate req.headers.origin against config.browserId.domains
  //   res.header('Access-Control-Allow-Origin', req.headers.origin)
  //   if (config.CORS.headers) { res.header('Access-Control-Allow-Headers', config.CORS.headers.join(', ')) }
  //   if (config.CORS.credentials) { res.header('Access-Control-Allow-Credentials', config.CORS.credentials) }
  //   if (config.CORS.methods) { res.header('Access-Control-Allow-Methods', config.CORS.methods.join(', ')) }
  //   if (config.CORS['max-age']) { res.header('Access-Control-Max-Age', config.CORS['max-age']) }
  //   res.send(200)
  //   return next()
  // })
}

const startServer = (server, config, log, eventEmitter) => {
  server.listen(config.api.port, () => {
    log.info(server.name + ' listening at ' + server.url)
    eventEmitter.emit('server_start')
  })
}
