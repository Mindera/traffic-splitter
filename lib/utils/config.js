'use strict'

module.exports = {
  // TODO: improve this in order to validate inner properties
  validate: (config) => {
    if (!config) { return false }

    const requiredProperties = [
      'api',
      'cors',
      'browserId',
      'circuitBreaker',
      'upstreams',
      'bunyan'
    ]

    return requiredProperties.every(property => config.hasOwnProperty(property))
  }
}
