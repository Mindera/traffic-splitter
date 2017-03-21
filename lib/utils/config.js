'use strict'

const clone = require('clone')
let configuration

module.exports = {
  validate: (config) => {
    [
      'api',
      'browserId',
      'cors',
      'circuitBreaker',
      'upstreams',
      'bunyan'
    ].forEach((property) => {
      if (!config.hasOwnProperty(property)) {
        throw new Error('Configuration is missing ' + property + ' property')
      }
    })
  },

  set: (config) => {
    module.exports.validate(config)
    configuration = config
  },

  get: () => {
    if (!configuration) { throw new Error('Configuration missing') }
    return clone(configuration)
  }
}
