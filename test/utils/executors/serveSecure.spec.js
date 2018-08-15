'use strict'

const https = require('https')
const { expect } = require('chai')
const { spy } = require('sinon')

const serveSecure = require('../../../lib/utils/executors/serveSecure')

const dummyFunction = () => {}

describe('Serve Secure', function () {
  before(function () {
    this.req = {}
    this.res = {}
    this.next = dummyFunction
  })

  it('should export a function', function () {
    expect(serveSecure).to.be.a('function')
  })

  it('should return a function', function () {
    expect(serveSecure(dummyFunction)).to.be.a('function')
  })

  it('should invoke handleServe with the correct parameter', function () {
    const handleServeSpy = spy(dummyFunction)
    const victim = serveSecure(handleServeSpy)
    const params = { httpsAgent: {} }
    const expectedParams = Object.assign({}, params, {
      httpAgent: params.httpsAgent,
      httpClient: https
    })

    victim(this.req, this.res, this.next, params)

    expect(handleServeSpy.calledWith(this.req, this.res, this.next, expectedParams)).to.be.true
  })
})
