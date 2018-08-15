'use strict'

const serve = require('./serve')

module.exports = {
  serve,
  serveSecure: serve,
  serveFile: require('./serveFile'),
  redirect: require('./redirect')
}
