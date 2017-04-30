const serve = require('./serve')
const redirect = require('./redirect')

module.exports = {
  serve,
  serveSecure: serve,
  redirect
}
