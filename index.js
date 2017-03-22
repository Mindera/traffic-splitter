'use strict'

const fs = require('fs')
let config = JSON.parse(fs.readFileSync('./conf/config.json'))

const TrafficSplitter = require('./lib/splitter')
// console.log(TrafficSplitter)

// this is optional since the splitter also does this
if (!TrafficSplitter.isConfigurationValid(config)) {
  throw new Error('My configuration is invalid!')
}

const splitter = new TrafficSplitter(config)
// console.log(splitter)

splitter.on('application_start', () => {
  console.log('application_start')
})

// start should only be called after adding all events, middlewares and rules
// start can only be called once in each instance
splitter.start()

// only the next line will be available in production
module.exports = TrafficSplitter
