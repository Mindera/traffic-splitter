const EventEmitter = require('events').EventEmitter
const clone = require('clone')
const utils = require('./utils')
const Server = require('./server')

function Splitter (configuration) {
  if (!utils.config.validate(configuration)) { throw new Error('Invalid configuration') }

  // Private
  const config = clone(configuration)
  const log = utils.logger.init(configuration)
  const bootstrapMiddlewares = []
  const requestMiddlewares = []
  const rules = {}
  const started = () => log.error('This splitter instance already started')
  let server

  // Otimize criteria
  config.upstreams = utils.config.getOptimizedUpstreams(config)

  // Public
  this.events = new EventEmitter()
  this.getConfiguration = () => clone(config)
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

  this.start = () => {
    this.events.emit('applicationStart')
    server = new Server(
      this.getConfiguration(),
      this.events,
      bootstrapMiddlewares,
      requestMiddlewares,
      rules,
      this.getLogger()
    )
    server.start()

    // redefine, fire once, and destroy
    this.start = started
  }
}

const isFunction = fn => fn && typeof fn === 'function'
const validateCallback = fn => { if (!isFunction(fn)) { throw new Error('Callback isn\'t a function') } }
const isString = str => str && typeof str === 'string'
const validateString = (str, msg) => { if (!isString(str)) { throw new Error(msg + ' isn\'t a string') } }

exports = module.exports = Splitter
exports.isConfigurationValid = (configuration) => utils.config.validate(configuration)
