'use strict'

const http = require('http')
const https = require('https')

const serve = require('./serve')

module.exports = (httpAgent, httpsAgent) => ({
  serve: serve(http, httpAgent),
  serveSecure: serve(https, httpsAgent),
  serveFile: require('./serveFile'),
  redirect: require('./redirect')
})
