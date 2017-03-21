'use strict'

const bunyan = require('bunyan')
const configuration = require('./config')
let logger

module.exports = {
  init: () => {
    const config = configuration.get().bunyan
    logger = bunyan.createLogger({
      name: config.name,
      streams: getBunyanStreams(config.streams)
    })
    return module.exports
  },

  get: () => {
    if (!logger) { module.exports.init() }
    return logger
  }
}

const getBunyanStreams = (streams) => {
  if (streams.length === 0) {
    streams.push({
      level: 'info',
      stream: process.stdout
    })
  }
  return streams
}
