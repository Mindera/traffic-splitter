const clone = require('clone')
const { EventEmitter } = require('events')

const Server = require('./server')
const { config, logger } = require('./utils')

function Splitter (configuration) {
  if (!config.validate(configuration)) { throw new Error('Invalid configuration') }

  // Private
  const clonedConfig = clone(configuration)
  const log = logger.init(configuration)
  const bootstrapMiddlewares = []
  const requestMiddlewares = []
  const rules = {}
  const executors = {}
  const started = () => log.error('This splitter instance already started')
  let server

  // Optimize criteria and handle performance config
  const optimizedConfig = Object.assign(
    {},
    clonedConfig,
    clonedConfig.rulesets ? {rulesets: config.getOptimizedRulesets(clonedConfig)} : {},
    {upstreams: config.getOptimizedUpstreams(clonedConfig)},
    {api: Object.assign({}, clonedConfig.api, {performance: config.getPerformance(clonedConfig.api)})}
  )

  // Public
  this.events = new EventEmitter()
  this.getConfiguration = () => clone(optimizedConfig)
  this.getLogger = () => log

  this.bootstrap = (fn) => {
    validateCallback(fn)
    bootstrapMiddlewares.push(fn)
  }

  this.use = (fn) => {
    validateCallback(fn)
    requestMiddlewares.push(fn)
  }

  this.addRule = (key, fn) => {
    validateString(key, 'Rule name')
    validateCallback(fn)
    rules[key] = fn
  }

  this.addExecutor = (key, fn) => {
    validateString(key, 'Executor name')
    validateCallback(fn)
    executors[key] = fn
  }

  this.start = () => {
    this.events.emit('applicationStart')
    server = new Server(
      this.getConfiguration(),
      this.events,
      bootstrapMiddlewares,
      requestMiddlewares,
      rules,
      executors,
      this.getLogger()
    )
    server.start()

    // redefine, fire once, and destroy
    this.start = started
  }
}

const isFunction = fn => fn && typeof fn === 'function'
const validateCallback = fn => { if (!isFunction(fn)) { throw new Error('Callback must be of type function') } }
const isString = str => str && typeof str === 'string'
const validateString = (str, msg) => { if (!isString(str)) { throw new Error(msg + ' must be of type string') } }

exports = module.exports = Splitter
exports.isConfigurationValid = (configuration) => config.validate(configuration)
