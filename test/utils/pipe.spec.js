'use strict'

const { expect } = require('chai')

const pipe = require('../../lib/utils/pipe')

describe('Pipe', function () {
  it('should export a function', function () {
    expect(pipe).to.be.a('function')
  })

  it('should return a middleware (function)', function () {
    const config = { api: {}, browserId: {}, upstreams: [] }
    const result = pipe(config)

    expect(result).to.be.a('function')
  })
})
