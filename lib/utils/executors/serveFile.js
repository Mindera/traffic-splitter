const fs = require('fs')
const path = require('path')
const mime = require('mime-types')

module.exports = (req, res, next, {config, eventEmitter, log, bidCookieDetails}) => {
  const opts = req.upstream.upstream.options
  const file = path.join(opts.path, opts.file)

  res.setHeader('content-type', mime.lookup(opts.file))

  if (typeof opts.download === 'boolean' && opts.download) {
    res.setHeader('content-disposition', 'attachment; filename=' + opts.file)

    fs.readFile(file, opts.encoding, (err, data) => {
      if (err) {
        eventEmitter.emit('servingFileError', err, req.upstreamm, new Date().getTime() - req.startTime)
      }

      res.send(data)
    })
  } else {
    fs.createReadStream(file).pipe(res)
  }
}
