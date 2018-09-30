'use strict'

const { expect } = require('chai')

const splitter = require('../lib/splitter')

describe('Splitter', () => {
  it('should export a function', () => {
    expect(splitter).to.be.a('function')
  })

  it('should contain static method', () => {
    expect(splitter.isConfigurationValid).to.be.a('function')
  })
})
