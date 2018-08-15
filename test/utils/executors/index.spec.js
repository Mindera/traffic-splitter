'use strict'

const { expect } = require('chai')

const splitterExecutors = require('../../../lib/utils/executors')

const dummyFunction = () => {}

describe('Executors', function () {
  it('should export a function', function () {
    expect(splitterExecutors).to.be.a('function')
  })

  it('should return an object', function () {
    const executors = splitterExecutors(dummyFunction, dummyFunction)

    expect(executors).to.have.all.keys([
      'serve',
      'serveSecure',
      'serveFile',
      'redirect'
    ])
  })
})
