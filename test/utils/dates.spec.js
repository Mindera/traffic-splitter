'use strict'

const { expect } = require('chai')
const { useFakeTimers } = require('sinon')

const { dates } = require('../../lib/utils/')

describe('Dates', function () {
  it('should export an object', function () {
    expect(dates).to.be.an('object')
      .and.to.have.all.keys(['getElapsedTime'])
  })

  describe('getElapsedTime()', function () {
    it('should be a function', function () {
      expect(dates.getElapsedTime).to.be.a('function')
    })

    it('should return the elapsed time since the given time', function () {
      const now = (new Date()).getTime()
      const clock = useFakeTimers(now)

      const duration = 1000
      const start = now - duration

      const elapsedTime = dates.getElapsedTime(start)

      expect(elapsedTime).to.equal(duration)
      clock.restore()
    })
  })
})
