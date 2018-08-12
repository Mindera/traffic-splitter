'use strict'

const fs = require('fs')
const path = require('path')
const mime = require('mime-types')

const { getElapsedTime } = require('../dates')

module.exports = (req, res, next, {config, eventEmitter, log, bidCookieDetails}) => {
  const { startTime, upstream } = req
  const opts = upstream.upstream.options
  const file = path.join(opts.path, opts.file)

  const emitServingEvent = (err) => {
    const duration = getElapsedTime(startTime)

    if (err) {
      eventEmitter.emit('servingFileError', err, upstream, duration)
    } else {
      eventEmitter.emit('servingFile', upstream, duration)
    }
  }

  res.setHeader('content-type', mime.lookup(opts.file))

  if (typeof opts.download === 'boolean' && opts.download) {
    res.setHeader('content-disposition', 'attachment; filename=' + opts.file)

    fs.readFile(file, opts.encoding, (err, data) => {
      emitServingEvent(err)
      res.send(err ? 500 : data)
    })
  } else {
    emitServingEvent()
    fs.createReadStream(file).pipe(res)
  }
}
