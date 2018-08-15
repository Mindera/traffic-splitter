'use strict'

const https = require('https')

module.exports = (handleServe) =>
  (req, res, next, parameters) => {
    parameters.httpAgent = parameters.httpsAgent
    parameters.httpClient = https

    handleServe(req, res, next, parameters)
  }
