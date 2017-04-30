const restify = require('restify')
const cookieParser = require('restify-cookies')
const clone = require('clone')
const {bid, cors, upstream, pipe} = require('./utils')

function Server (config, eventEmitter, bootstrapMiddlewares, requestMiddlewares, rules, log) {
  this.start = () => {
    const server = createServer(config)

    // options and healthcheck must be before the middlewares
    setServerOptions(server, config)
    createHealthCheckEndpoint(server)

    // missing apply default configs
    loadBootstrapMiddlewares(server, config, bootstrapMiddlewares)
    setStartTimeOnRequest(server)
    setServerMaxConnections(server, config)
    loadRequestMiddlewares(server, config, requestMiddlewares)
    loadRestifyMiddlewares(server)
    server.use(bid.extractBrowserId(config))
    server.use(upstream.determineUpstream(config, eventEmitter, rules, log))
    // missing circuitBreaker
    handleReqFinish(server, eventEmitter, log)
    // missing load spies
    configureListeners(server, config, eventEmitter, log)
    startServer(server, config, eventEmitter, log)
  }
}

exports = module.exports = Server

const createServer = ({api}) => restify.createServer({
  name: api.serverName || 'Traffic Splitter'
})

const setServerOptions = (server, config) => {
  server.opts(/.*/, (req, res, next) => {
    const headers = cors.getHeaders(req.headers || {}, config)
    Object.keys(headers).forEach(key => { res.header(key, headers[key]) })
    res.send(200)
    next()
  })
}

const createHealthCheckEndpoint = server => {
  server.get('/healthcheck', (req, res, next) => {
    return res.send({ status: 'OK' })
  })
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

const configureListeners = (server, config, eventEmitter, log) => {
  const action = pipe.pipe(config, eventEmitter, log)
  server.get(/.*/, action)
  server.post(/.*/, action)
  server.del(/.*/, action)
  server.put(/.*/, action)
}

const startServer = (server, {api}, eventEmitter, log) => {
  server.listen(api.port, () => {
    log.info(server.name + ' listening at ' + server.url)
    eventEmitter.emit('serverStart')
  })
}
