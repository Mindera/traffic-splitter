'use strict'

const serve = require('./serve')
const serveSecure = require('./serveSecure')
const handleServe = require('./handleServe')

module.exports = {
  serve: serve(handleServe),
  serveSecure: serveSecure(handleServe),
  serveFile: require('./serveFile'),
  redirect: require('./redirect')
}
