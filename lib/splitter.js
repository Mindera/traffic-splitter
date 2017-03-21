'use strict'

const utils = require('./utils')
const config = utils.config
const logger = utils.logger

exports = module.exports = createSplitter

function createSplitter (configuration) {
  config.set(configuration)
  logger.init()
}
