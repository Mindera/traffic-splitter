'use strict'

const EventEmitter = require('events').EventEmitter
const mixin = require('merge-descriptors')
const clone = require('clone')
const utils = require('./utils')

function Splitter (configuration) {
  if (!utils.config.validate(configuration)) {
    throw new Error('Invalid configuration')
  }

  let config = clone(configuration)
  this.getConfiguration = function () {
    return clone(config)
  }

  let logger = utils.logger.init(clone(config.bunyan))
  this.getLogger = function () {
    return logger
  }

  mixin(this, EventEmitter.prototype, false)
}

Splitter.prototype.start = function () {
  this.emit('application_start')
  delete Splitter.prototype.start

  // following functions don't exist yet
  delete Splitter.prototype.bootstrap
  delete Splitter.prototype.use
  delete Splitter.prototype.addRule
}

exports = module.exports = Splitter

exports.isConfigurationValid = function (configuration) {
  return utils.config.validate(configuration)
}
