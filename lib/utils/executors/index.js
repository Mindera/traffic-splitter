const serve = require('./serve')
const serveFile = require('./serveFile')
const redirect = require('./redirect')

module.exports = {
  serve,
  serveSecure: serve,
  serveFile,
  redirect
}
