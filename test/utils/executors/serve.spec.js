'use strict'

const http = require('http')
const { expect } = require('chai')
const { spy } = require('sinon')

const serve = require('../../../lib/utils/executors/serve')

const dummyFunction = () => {}

describe('Serve', function () {
  before(function () {
    this.req = {}
    this.res = {}
    this.next = dummyFunction
  })

  it('should export a function', function () {
    expect(serve).to.be.a('function')
  })

  it('should return a function', function () {
    expect(serve(dummyFunction)).to.be.a('function')
  })

  it('should invoke handleServe with the correct parameter', function () {
    const handleServeSpy = spy(dummyFunction)
    const victim = serve(handleServeSpy)
    const params = { randomParameters: {} }
    const expectedParams = Object.assign({}, params, { httpClient: http })

    victim(this.req, this.res, this.next, params)

    expect(handleServeSpy.calledWith(this.req, this.res, this.next, expectedParams)).to.be.true
  })
})
