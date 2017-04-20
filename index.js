const fs = require('fs')
const config = JSON.parse(fs.readFileSync('./conf/config.json'))
const TrafficSplitter = require('./lib/splitter')

if (!TrafficSplitter.isConfigurationValid(config)) { throw new Error('My configuration is invalid!') }

const splitter = new TrafficSplitter(config)
const log = splitter.getLogger()

splitter.bootstrap((server, config) => { log.info('bootstrap_application_start') })
splitter.bootstrap((server, config) => { log.info('bootstrap_application_start_') })
splitter.bootstrap((server, config) => { log.info('bootstrap_application_start__') })

splitter.use((server, config) => (req, res, next) => {
  console.log('---------------------------------------------------------------------------------------------------------------')
  log.info('requestMiddleware')
  return next()
})
splitter.use((server, config) => (req, res, next) => {
  log.info('anotherRequestMiddleware')
  return next()
})

splitter.addRule('myCustomRule1', (criteria, req) => {
  console.log(criteria)
  return true
})
splitter.addRule('myCustomRule2', (criteria, req) => {
  console.log(criteria)
  return false
})

splitter.events.on('applicationStart', () => {
  log.info('Event: applicationStart')
})
splitter.events.on('serverStart', () => {
  log.info('Event: serverStart')
  for (let i = 0; i < 20; i++) { console.log('') }
})
splitter.events.on('rulesProcessing', (duration, selectedUpstream) => {
  log.info('Event: rulesProcessing -> duration = ', duration)
  log.info('Event: rulesProcessing -> selected_upstream = ', selectedUpstream)
})
splitter.events.on('noUpstreamFound', (req) => {
  log.info('Event: noUpstreamFound -> ', req.url)
})
splitter.events.on('resFinish', (req, res, duration) => {
  log.info('Event: resFinish -> duration = ', duration)
})

// start should only be called after adding all events, middlewares and rules
// start can only be called once
splitter.start()
// splitter.start() // will trigger error message
