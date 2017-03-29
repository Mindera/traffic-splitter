const fs = require('fs')
const config = JSON.parse(fs.readFileSync('./conf/config.json'))
const Splitter = require('./lib/splitter')

if (!Splitter.isConfigurationValid(config)) {
  throw new Error('My configuration is invalid!')
}

const splitter = new Splitter(config)
const log = splitter.getLogger()

splitter.bootstrap((server, config) => { log.info('bootstrap_application_start') })
splitter.bootstrap((server, config) => { log.info('bootstrap_application_start_') })
splitter.bootstrap((server, config) => { log.info('bootstrap_application_start__') })

splitter.use((server, config) => (req, res, next) => {
  log.info('request_middleware')
  return next()
})
splitter.use((server, config) => (req, res, next) => {
  log.info('request_middleware_')
  return next()
})

splitter.addRule('myHost', (criteria, req) => {
  return true
})

splitter.events.on('application_start', () => {
  log.info('Event: application_start')
})
splitter.events.on('server_start', () => {
  log.info('Event: server_start')
})
splitter.events.on('res_finish', (req, res, duration) => {
  log.info('Event: res_finish -> duration = ', duration)
})

// start should only be called after adding all events, middlewares and rules
// start can only be called once
splitter.start()
// splitter.start() // will trigger error message
