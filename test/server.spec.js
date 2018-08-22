'use strict'

const { expect } = require('chai')

const server = require('../lib/server')

describe('Server', function () {
  it('should export a function', function () {
    expect(server).to.be.a('function')
  })
})
