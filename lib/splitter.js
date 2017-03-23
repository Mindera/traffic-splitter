const EventEmitter = require('events').EventEmitter
const clone = require('clone')
const utils = require('./utils')

function Splitter (configuration) {
  if (!utils.config.validate(configuration)) {
    throw new Error('Invalid configuration')
  }

  // Private
  const config = clone(configuration)
  const logger = utils.logger.init(clone(config.bunyan))
  // Public
  this.eventEmitter = new EventEmitter()

  this.getConfiguration = () => {
    return clone(config)
  }

  this.getLogger = () => {
    return logger
  }

  this.start = () => {
    this.eventEmitter.emit('application_start')
    // redefine, fire once, and destroy
    this.start = () => {}
  }
}

module.exports = Splitter
