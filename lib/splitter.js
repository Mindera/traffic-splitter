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
  this.events = new EventEmitter()
  this.getConfiguration = () => clone(config)
  this.getLogger = () => logger
  this.start = () => {
    this.events.emit('application_start')

    // redefine, fire once, and destroy
    this.start = () => {
      logger.error('This splitter instance already started!')
    }
  }
}

exports = module.exports = Splitter
exports.isConfigurationValid = (configuration) => utils.config.validate(configuration)
