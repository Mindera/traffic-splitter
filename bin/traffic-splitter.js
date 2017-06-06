#!/usr/bin/env node

const program = require('commander')
const chalk = require('chalk')

const error = chalk.bold.red
const logErr = (msg) => console.log(error(msg))

program
  .version(require('../package.json').version)
  .description('For better use of traffic-splitter create an isolated app. Take advantage of custom rules, handling events and adding middlewares.')
  .option('-c, --conf <file>', 'provide configuration file (.json or .js with module.exports = {...})')

program.on('/help', () => program.help())

program.parse(process.argv)

if (!program.conf) {
  logErr('Missing configuration file.')
  logErr('Use: traffic-splitter -c yourConfigurationFile.')
  program.help()
}

let config
try {
  config = require(process.cwd() + '/' + program.conf)
} catch (err) {
  logErr(err)
  process.exit(1)
}

const TrafficSplitter = require('..')

if (!TrafficSplitter.isConfigurationValid(config)) {
  logErr('Invalid configuration. Please check traffic-splitter documentation at http://trafficsplitter.io')
  process.exit(1)
}

try {
  const splitter = new TrafficSplitter(config)
  splitter.start()
} catch (err) {
  logErr(err)
  process.exit(1)
}
