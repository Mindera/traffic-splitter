'use strict'

const fs = require('fs')
let config = JSON.parse(fs.readFileSync('./stuff/config.json'))

const trafficSplitter = require('./lib/splitter')
// console.log(trafficSplitter)

const splitter = trafficSplitter(config)

// only the next line will be available in production
module.exports = trafficSplitter
