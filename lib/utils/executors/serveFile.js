const fs = require('fs')
const path = require('path')
const mime = require('mime-types')

const { getElapsedTime } = require('../dates')

module.exports = (req, res, next, {config, eventEmitter, log, bidCookieDetails}) => {
  const opts = req.upstream.upstream.options
  const file = path.join(opts.path, opts.file)

  res.setHeader('content-type', mime.lookup(opts.file))

  if (typeof opts.download === 'boolean' && opts.download) {
    res.setHeader('content-disposition', 'attachment; filename=' + opts.file)

    fs.readFile(file, opts.encoding, (err, data) => {
      const duration = getElapsedTime(req.startTime)

      if (err) {
        eventEmitter.emit('servingFileError', err, req.upstreamm, duration)
      } else {
        eventEmitter.emit('servingFile', req.upstreamm, duration)
      }

      res.send(data)
    })
  } else {
    fs.createReadStream(file).pipe(res)
  }
}
