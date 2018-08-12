'use strict'

const { expect } = require('chai')

const { evaluateRules } = require('../../lib/utils/rules')

const bid56 = 'b72559fc5490'
const bid80 = 'dc3d860620cc'
const customRuleFn = (criteria, req) => criteria === 'customValue'
const overrideHostRuleFn = (criteria, req) => criteria.every(host => host !== 'www.random.org')

const host = ['localhost', 'www.mindera.com', 'www.google.com', 'www.sapo.pt']
const path = ['/blog', '/people-and-culture', 'case-studie'].map(path => new RegExp('^' + path + '([/?].*)?$', 'i'))
const bucket = [{ min: 10, max: 30 }, { min: 50, max: 75 }, { min: 85, max: 100 }]
const cookie = [{ name: 'name', value: 'traffic-splitter' }, { name: 'awesomeness', value: '100' }, { name: 'random', value: 'as hell' }]
const agent = ['Chrome', 'Safari'].map(a => new RegExp(a, 'gi'))
const geoip = [{ country: 'PT' }].map(g => [g.country, g.region, g.city].join('.'))
const device = [{ device: 'phone', type: 'Sony' }, { device: 'tablet' }, { device: 'desktop', browser: 'Firefox', version: { from: 35, to: 37 } }]
const and = [{ host }, { path }]
const or = and
const costumRules = { customRule: customRuleFn }
const overridingRules = { host: overrideHostRuleFn }

describe('Evaluate Rules', () => {
  describe('Evaluate with no rules', () => {
    it('Should return true because there are no rules assigned', () => {
      const result = evaluateRules({}, {}, {}, {})
      expect(result).to.be.true
    })
  })

  describe('Evaluate Host', () => {
    it('Should return true because host is set but has no values', () => {
      const result = evaluateRules({ host: [] }, {}, {}, {})
      expect(result).to.be.true
    })

    it('Should return false because req has no headers object', () => {
      const result = evaluateRules({ host }, {}, {}, {})
      expect(result).to.be.false
    })

    it('Should return false because req.headers has no properties', () => {
      const result = evaluateRules({ host }, { headers: {} }, {}, {})
      expect(result).to.be.false
    })

    it('Should return true because given host belongs to the list', () => {
      const result = evaluateRules({ host }, { headers: { host: 'www.mindera.com' } }, {}, {})
      expect(result).to.be.true
    })

    it('Should return false because given host doesn\'t belong to the list', () => {
      const result = evaluateRules({ host }, { headers: { host: 'www.false.com' } }, {}, {})
      expect(result).to.be.false
    })
  })

  describe('Evaluate Path', () => {
    it('Should return true because path is set but has no values', () => {
      const result = evaluateRules({ path: [] }, {}, {}, {})
      expect(result).to.be.true
    })

    it('Should return false because no path was provided on the request', () => {
      const result = evaluateRules({ path }, {}, {}, {})
      expect(result).to.be.false
    })

    it('Should return true because given path belongs to the list', () => {
      const result = evaluateRules({ path }, { url: '/blog' }, {}, {})
      expect(result).to.be.true
    })

    it('Should return false because path must be exact', () => {
      const result = evaluateRules({ path }, { url: '/blogs' }, {}, {})
      expect(result).to.be.false
    })

    it('Should return false because path doesn\'t belong to the list', () => {
      const result = evaluateRules({ path }, { url: '/test' }, {}, {})
      expect(result).to.be.false
    })

    it('Should return true because only first part of path counts', () => {
      const result = evaluateRules({ path }, { url: '/blog/article' }, {}, {})
      expect(result).to.be.true
    })

    it('Should return true because only first part of path counts', () => {
      const result = evaluateRules({ path }, { url: '/blog/' }, {}, {})
      expect(result).to.be.true
    })

    it('Should return true because get parameters were allowed', () => {
      const result = evaluateRules({ path }, { url: '/blog?article=article1' }, {}, {})
      expect(result).to.be.true
    })
  })

  describe('Evaluate Bucket', () => {
    it('Should return true because bucket is set but has no values', () => {
      const result = evaluateRules({ bucket: [] }, {}, {}, {})
      expect(result).to.be.true
    })

    it('Should return true because bid56 is on the list', () => {
      const result = evaluateRules({ bucket }, { bid: bid56 }, {}, {})
      expect(result).to.be.true
    })

    it('Should return false because bid80 isn\'t on the list', () => {
      const result = evaluateRules({ bucket }, { bid: bid80 }, {}, {})
      expect(result).to.be.false
    })
  })

  describe('Evaluate Cookie', () => {
    it('Should return true because cookie is set but has no values', () => {
      const result = evaluateRules({ cookie: [] }, {}, {}, {})
      expect(result).to.be.true
    })

    it('Should return false because req.cookies is undefined', () => {
      const result = evaluateRules({ cookie }, {}, {}, {})
      expect(result).to.be.false
    })

    it('Should return false because cookie is set but has no properties', () => {
      const result = evaluateRules({ cookie }, { cookies: {} }, {}, {})
      expect(result).to.be.false
    })

    it('Should return true because cookie is on the list', () => {
      const result = evaluateRules({ cookie }, { cookies: { name: 'traffic-splitter' } }, {}, {})
      expect(result).to.be.true
    })

    it('Should return false because cookie is on the list but has a incorrect value', () => {
      const result = evaluateRules({ cookie }, { cookies: { name: 'trafficSplitter' } }, {}, {})
      expect(result).to.be.false
    })

    it('Should return true because at least one cookie is on the list', () => {
      const result = evaluateRules({ cookie }, { cookies: { name: 'trafficSplitter', just: 'anotherOne' } }, {}, {})
      expect(result).to.be.false
    })

    it('Should return false because no cookie is on the list', () => {
      const result = evaluateRules({ cookie }, { cookies: { fail: 'noSuchCookie', just: 'anotherOne' } }, {}, {})
      expect(result).to.be.false
    })
  })

  describe('Evalute User Agent', () => {
    it('Should return true because agent is set but has no values', () => {
      const result = evaluateRules({ agent: [] }, {}, {}, {})
      expect(result).to.be.true
    })

    it('Should return false because headers aren\'t set', () => {
      const result = evaluateRules({ agent }, {}, {}, {})
      expect(result).to.be.false
    })

    it('Should return false because headers is set but has no user-agent property', () => {
      const result = evaluateRules({ agent }, { headers: {} }, {}, {})
      expect(result).to.be.false
    })

    it('Should return true because given agent is on the list', () => {
      const result = evaluateRules({ agent }, { headers: { 'user-agent': 'Chrome/58.0.3029.96' } }, {}, {})
      expect(result).to.be.true
    })

    it('Should return true because given agent is on the list', () => {
      const result = evaluateRules({ agent }, { headers: { 'user-agent': 'Safari/537.36' } }, {}, {})
      expect(result).to.be.true
    })

    it('Should return false because given agent isn\'t on the list', () => {
      const result = evaluateRules({ agent }, { headers: { 'user-agent': 'Firefox/40.1' } }, {}, {})
      expect(result).to.be.false
    })

    it('Should return false because given agent isn\'t on the list', () => {
      const result = evaluateRules({ agent }, { headers: { 'user-agent': 'Netscape/9.1.0285' } }, {}, {})
      expect(result).to.be.false
    })
  })

  describe('Evaluate GeoIp', () => {
    it('Should return true because geoip is set but has no values', () => {
      const result = evaluateRules({ geoip: [] }, {}, {}, {})
      expect(result).to.be.true
    })

    it('Should return false because splitterIP parameter isn\'t set', () => {
      const result = evaluateRules({ geoip }, { headers: {}, connection: {}, socket: {} }, {}, {})
      expect(result).to.be.false
    })

    it('Should return true because given ip is on the list', () => {
      const result = evaluateRules({ geoip }, { params: { splitterIP: '37.189.217.176' }, headers: {}, connection: {}, socket: {} }, {}, {})
      expect(result).to.be.true
    })
  })

  describe('Evaluate Device', () => {
    // device = [{ device: 'phone', type: 'Sony' }, { device: 'tablet' }, { device: 'desktop', browser: 'Firefox', version: { from: 35, to: 37 } }]
    it('Should return true because device is set but has no values', () => {
      const result = evaluateRules({ device: [] }, {}, {}, {})
      expect(result).to.be.true
    })

    it('Should return false because headers aren\'t set', () => {
      const result = evaluateRules({ device }, {}, {}, {})
      expect(result).to.be.false
    })

    it('Should return false because headers are set but there is no user-agent property', () => {
      const result = evaluateRules({ device }, { headers: {} }, {}, {})
      expect(result).to.be.false
    })

    it('Should return true because given device is on the list', () => {
      const result = evaluateRules({ device },
        { headers: { 'user-agent': 'Mozilla/5.0 (Linux; U; Android 4.0.3; en-in; SonyEricssonMT11i' +
          ' Build/4.1.A.0.562) AppleWebKit/534.30 (KHTML, like Gecko)' +
          ' Version/4.0 Mobile Safari/534.30' } },
        {}, {}
      )
      expect(result).to.be.true
    })

    it('Should return true because given browser version is allowed', () => {
      const result = evaluateRules({ device }, { headers: { 'user-agent': 'Firefox/36.0.3029.96' } }, {}, {})
      expect(result).to.be.true
    })

    it('Should return false because given browser version isn\'t allowed', () => {
      const result = evaluateRules({ device }, { headers: { 'user-agent': 'Firefox/40.0.3029.96' } }, {}, {})
      expect(result).to.be.false
    })

    it('Should return true because given agent version is a tablet (allowed)', () => {
      const result = evaluateRules({ device }, { headers: { 'user-agent': 'Mozilla/5.0 (Linux; Android 7.0; Pixel C Build/NRD90M; wv)' } }, {}, {})
      expect(result).to.be.true
    })

    it('Should return false because given agent device is correct but type isn\'t', () => {
      const result = evaluateRules({ device }, { headers: { 'user-agent': 'Mozilla/5.0 (Linux; Android 6.0.1; Nexus 6P Build/MMB29P)' } }, {}, {})
      expect(result).to.be.false
    })
  })

  describe('Evaluate Visitor', () => {
    it('Should return true because no bid cookie is set (visitor)', () => {
      const result = evaluateRules({ visitor: true }, {}, {}, {})
      expect(result).to.be.true
    })

    it('Should return false because no bid cookie is set (not visitor)', () => {
      const result = evaluateRules({ visitor: false }, {}, {}, {})
      expect(result).to.be.false
    })

    it('Should return false because bid cookie is set (visitor)', () => {
      const result = evaluateRules({ visitor: true }, { cookies: { bid: bid56 } }, {}, {})
      expect(result).to.be.false
    })

    it('Should return true because bid cookie is set (not visitor)', () => {
      const result = evaluateRules({ visitor: false }, { cookies: { bid: bid56 } }, {}, {})
      expect(result).to.be.true
    })
  })

  describe('Evaluate operator AND', () => {
    it('Should return true because AND is empty', () => {
      const result = evaluateRules({ and: [] }, {}, {}, {})
      expect(result).to.be.true
    })

    it('Should return false because no rule matches', () => {
      const result = evaluateRules({ and }, { headers: { host: 'www.fail.com' }, url: '/fail' }, {}, {})
      expect(result).to.be.false
    })

    it('Should return false because only one rule matches', () => {
      const result = evaluateRules({ and }, { headers: { host: 'www.mindera.com' }, url: '/fail' }, {}, {})
      expect(result).to.be.false
    })

    it('Should return false because only one rule matches', () => {
      const result = evaluateRules({ and }, { headers: { host: 'www.fail.com' }, url: '/blog' }, {}, {})
      expect(result).to.be.false
    })

    it('Should return true because both rules match', () => {
      const result = evaluateRules({ and }, { headers: { host: 'www.mindera.com' }, url: '/blog' }, {}, {})
      expect(result).to.be.true
    })
  })

  describe('Evaluate operator OR', () => {
    it('Should return true because OR is empty', () => {
      const result = evaluateRules({ or: [] }, {}, {}, {})
      expect(result).to.be.true
    })

    it('Should return false because no rule matches', () => {
      const result = evaluateRules({ or }, { headers: { host: 'www.fail.com' }, url: '/fail' }, {}, {})
      expect(result).to.be.false
    })

    it('Should return true because at least one rule matches', () => {
      const result = evaluateRules({ or }, { headers: { host: 'www.mindera.com' }, url: '/fail' }, {}, {})
      expect(result).to.be.true
    })

    it('Should return true because at least one rule matches', () => {
      const result = evaluateRules({ or }, { headers: { host: 'www.fail.com' }, url: '/blog' }, {}, {})
      expect(result).to.be.true
    })

    it('Should return true because both rules match', () => {
      const result = evaluateRules({ or }, { headers: { host: 'www.mindera.com' }, url: '/blog' }, {}, {})
      expect(result).to.be.true
    })
  })

  describe('Evaluate User Rules', () => {
    describe('Evaluate Custom Rules', () => {
      it('Should return true because costum rule returns true', () => {
        const result = evaluateRules({ customRule: 'customValue' }, {}, {}, costumRules)
        expect(result).to.be.true
      })

      it('Should return false because costum rule returns false', () => {
        const result = evaluateRules({ customRule: 'customWrongValue' }, {}, {}, costumRules)
        expect(result).to.be.false
      })
    })

    describe('Evaluate Overriding Splitter Rules', () => {
      it('Should return true because all hosts are different from www.random.org', () => {
        const result = evaluateRules({ host }, {}, {}, overridingRules)
        expect(result).to.be.true
      })

      it('Should return false because given hosts have value www.random.org', () => {
        const result = evaluateRules({ host: ['www.random_.org', 'www.random.org', 'www.random__.org'] }, {}, {}, overridingRules)
        expect(result).to.be.false
      })
    })
  })
})
