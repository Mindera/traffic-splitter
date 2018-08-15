'use strict'

const bunyan_ = require('bunyan')

module.exports = {
  init: ({bunyan}) =>
    bunyan_.createLogger({
      name: bunyan.name,
      streams: getBunyanStreams(bunyan)
    })
}

const getBunyanStreams = ({streams}) => {
  if (streams.length === 0) {
    streams.push({
      level: 'info',
      stream: process.stdout
    })
  }
  return streams
}
