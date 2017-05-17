const serve = require('./serve')
const redirect = require('./redirect')
const loadbalancer = require('./loadbalancer')

module.exports = {
  serve,
  serveSecure: serve,
  redirect,
  loadbalancer
}
