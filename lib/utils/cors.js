module.exports = {
  setServerOptions: (server, cors) => {
    server.opts(/.*/, (req, res, next) => {
      if (req.headers && isOriginInDomains(req.headers.origin, cors.domains)) {
        res.header('Access-Control-Allow-Origin', req.headers.origin)
        if (cors.headers) { res.header('Access-Control-Allow-Headers', cors.headers.join(', ')) }
        if (cors.credentials) { res.header('Access-Control-Allow-Credentials', cors.credentials) }
        if (cors.methods) { res.header('Access-Control-Allow-Methods', cors.methods.join(', ')) }
        if (cors['max-age']) { res.header('Access-Control-Max-Age', cors['max-age']) }
      }
      res.send(200)
      next()
    })
  },
  originMatchesDomains: (origin, cors) => isOriginInDomains(origin, cors.domains)
}

const isOriginInDomains = (origin, domains) => {
  if (!origin || !domains) { return false }
  return domains.some(domain => origin.slice(-domain.length) === domain)
}
