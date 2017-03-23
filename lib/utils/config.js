'use strict'

module.exports = {
  // TODO: improve this in order to validate inner properties
  validate: function (config) {
    if (!config) {
      return false
    }

    const requiredProperties = [
      'api',
      'cors',
      'browserId',
      'circuitBreaker',
      'upstreams',
      'bunyan'
    ]

    return requiredProperties.every((property) => {
      return config.hasOwnProperty(property)
    })
  }
}
