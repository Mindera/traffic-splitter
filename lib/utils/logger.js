'use strict'

const bunyan = require('bunyan')

module.exports = {
  init: function (config) {
    return bunyan.createLogger({
      name: config.name,
      streams: getBunyanStreams(config.streams)
    })
  }
}

const getBunyanStreams = function (streams) {
  if (streams.length === 0) {
    streams.push({
      level: 'info',
      stream: process.stdout
    })
  }
  return streams
}
