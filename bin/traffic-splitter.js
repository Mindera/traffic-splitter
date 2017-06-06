#!/usr/bin/env node

const program = require('commander')
const chalk = require('chalk')

const error = chalk.bold.red
const logErr = (msg) => console.log(error(msg))

program
  .version('1.0.0')
  .description('For better use of traffic-splitter create an isolated app. Take advantage of custom rules, handling events and adding middlewares.')
  .option('-c, --conf <file>', 'provide configuration')

program.on('/help', () => program.help())

program.parse(process.argv)

if (!program.conf) {
  logErr('Configuration missing.')
  logErr('Use: traffic-splitter -c yourConfiguration.json.')
  program.help()
}

if (!program.conf.endsWith('.json')) {
  logErr('Configuration file must be a JSON file.')
  process.exit(1)
}

const fs = require('fs')
let config
try {
  config = JSON.parse(fs.readFileSync(program.conf))
} catch (err) {
  logErr(err)
  process.exit(1)
}

const TrafficSplitter = require('..')

if (!TrafficSplitter.isConfigurationValid(config)) {
  logErr('Configuration invalid. Please check traffic-splitter documentation at http://trafficsplitter.io')
  process.exit()
}

try {
  const splitter = new TrafficSplitter(config)
  splitter.start()
} catch (err) {
  logErr(err)
  process.exit(1)
}
