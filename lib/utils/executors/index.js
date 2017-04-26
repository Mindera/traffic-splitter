const serve = require('./serve')
const redirect = require('./redirect')

module.exports = {
  serve,
  serveHTTPS: serve,
  redirect
}
