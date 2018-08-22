'use strict'

const { expect } = require('chai')

const splitter = require('../lib/splitter')

describe('Splitter', function () {
  it('should export a function', function () {
    expect(splitter).to.be.a('function')
  })
})
