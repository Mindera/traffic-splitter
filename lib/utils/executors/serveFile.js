const fs = require('fs')
const path = require('path')
const mime = require('mime-types')

module.exports = (req, res, next, {config, eventEmitter, log, bidCookieDetails}) => {
  const opts = req.upstream.upstream.options
  const file = path.join(opts.path, opts.file)

  res.set({ 'content-type': mime.lookup(opts.file) })

  if (!opts.download) {
    fs.createReadStream(file).pipe(res)
  } else {
    res.set({ 'content-disposition': opts.file })

    fs.readFile(file, (err, data) => {
      if (err) {
        eventEmitter.emit('servingFileError', err, req.upstreamm, new Date().getTime() - req.startTime)
      }

      res.send(data)
    })
  }
}
