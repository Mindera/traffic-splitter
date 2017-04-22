const findIndexOfOrigin = ({origin}, {domains}) => {
  if (!origin || !domains) { return -1 }
  return domains.findIndex(domain => origin.slice(-domain.length) === domain)
}

module.exports = {
  findIndexOfOrigin,
  setServerOptions: (server, {CORS}) => {
    server.opts(/.*/, (req, res, next) => {
      if (req.headers && findIndexOfOrigin(req.headers, CORS) >= 0) {
        res.header('Access-Control-Allow-Origin', req.headers.origin)
        if (CORS.headers) { res.header('Access-Control-Allow-Headers', CORS.headers.join(', ')) }
        if (CORS.credentials) { res.header('Access-Control-Allow-Credentials', CORS.credentials) }
        if (CORS.methods) { res.header('Access-Control-Allow-Methods', CORS.methods.join(', ')) }
        if (CORS['max-age']) { res.header('Access-Control-Max-Age', CORS['max-age']) }
      }
      res.send(200)
      next()
    })
  }
}
