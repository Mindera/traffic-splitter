const {expect} = require('chai')
const {config} = require('../../lib/utils')

const geoips = [
  {
    country: 'US',
    region: 'TX',
    city: 'San Antonio'
  },
  {
    country: 'PT',
    region: '03',
    city: 'Braga'
  },
  {
    country: 'PT',
    region: '11',
    city: 'Lisboa'
  }
]
const agents = ['Chrome', 'Safari', 'Netscape']
const paths = ['/one', '/two', '/three']

const upstreams = [
  {
    name: 'first',
    enabled: true,
    criteria: {
      in: {
        ruleset: ['first', 'third']
      },
      out: {
        ruleset: ['second']
      }
    },
    upstream: 'mindera'
  },
  {
    name: 'second',
    enabled: true,
    criteria: {
      in: {
        ruleset: ['second', 'third']
      }
    },
    upstream: 'mindera'
  },
  {
    name: 'third',
    enabled: true,
    criteria: {
      in: {
        ruleset: ['second', 'third'],
        agent: ['Firefox', 'Opera', 'Vivaldi']
      }
    },
    upstream: 'mindera'
  },
  {
    name: 'fourth',
    enabled: true,
    criteria: {
      in: {
        and: [
          {
            path: paths
          },
          {
            or: [
              {
                path: paths
              }
            ]
          }
        ],
        or: [
          {
            path: paths
          },
          {
            and: [
              {
                path: paths
              }
            ]
          }
        ]
      }
    },
    upstream: 'mindera'
  },
  {
    name: 'fifth',
    enabled: true,
    upstream: 'mindera'
  },
  {
    name: 'sixth',
    enabled: true,
    criteria: {
      in: {
        geoip: geoips,
        agent: agents,
        path: paths
      }
    },
    upstream: 'mindera'
  },
  {
    name: 'seventh',
    enabled: true,
    criteria: {},
    upstream: {
      type: 'serve',
      options: {
        host: 'www.mindera.com',
        rewrite: {
          expression: '(.*)',
          to: '/noticias/atualidade'
        }
      }
    }
  }
]

const upstreamsReferences = {
  mindera: {
    type: 'serve',
    options: {
      host: 'www.mindera.com'
    }
  }
}

const optimizedUpstreams = config.getOptimizedUpstreams({
  pathRegExp: {
    prefix: '^',
    sufix: '([/?].*)?$'
  },
  upstreams,
  upstreamsReferences
})

describe('Evaluate configuration optimization', () => {
  describe('Evaluate upstream references', function () {
    it('Should set upstream when it is provided by name reference', () => {
      expect(optimizedUpstreams[0].upstream).to.deep.equal(upstreamsReferences.mindera)
    })
  })

  describe('Evaluate rulesets concatenation', () => {
    describe('Evaluate survival of ruleset property', () => {
      it('Should keep property in criteria.in', () => {
        expect(optimizedUpstreams[0]).to.have.deep.property('criteria.in.ruleset')
      })

      it('Should keep property in criteria.out', () => {
        expect(optimizedUpstreams[0]).to.have.deep.property('criteria.out.ruleset')
      })
    })

    describe('Evaluate that properties from rulesets aren\'t being added to criteria', () => {
      it('Should not have properties from rulesets', () => {
        expect(optimizedUpstreams[1]).to.not.have.deep.property('criteria.in.agent')
        expect(optimizedUpstreams[1]).to.not.have.deep.property('criteria.in.bucket')
        expect(optimizedUpstreams[1]).to.not.have.deep.property('criteria.in.cookie')
      })

      it('Should keep property from own criteria and not override from ruleset', () => {
        expect(optimizedUpstreams[2]).to.have.deep.property('criteria.in.agent')
          .and.to.have.lengthOf(3)
      })
    })
  })

  describe('Evaluate optimization of properties inside operators', () => {
    describe('Evaluate operator AND', () => {
      it('Should have properties and be optimized', () => {
        expect(optimizedUpstreams[3]).to.have.deep.property('criteria.in.and[0].path')
          .and.to.have.lengthOf(paths.length)
          .and.not.equal(paths)
      })

      it('Should have operator and have properties optimized', () => {
        expect(optimizedUpstreams[3]).to.have.deep.property('criteria.in.and[1].or[0].path')
          .and.to.have.lengthOf(paths.length)
          .and.not.equal(paths)
      })
    })

    describe('Evaluate operator OR', () => {
      it('Should have properties and be optimized', () => {
        expect(optimizedUpstreams[3]).to.have.deep.property('criteria.in.or[0].path')
          .and.to.have.lengthOf(paths.length)
          .and.not.equal(paths)
      })

      it('Should have operator and have properties optimized', () => {
        expect(optimizedUpstreams[3]).to.have.deep.property('criteria.in.or[1].and[0].path')
          .and.to.have.lengthOf(paths.length)
          .and.not.equal(paths)
      })
    })
  })

  describe('Evaluate upstream without criteria', () => {
    it('Should have criteria property', () => {
      expect(optimizedUpstreams[4]).to.have.property('criteria')
        .and.to.not.be.undefined
    })

    it('Should have criteria.in property and be undefined', () => {
      expect(optimizedUpstreams[4]).to.have.deep.property('criteria.in')
        .and.to.be.undefined
    })

    it('Should have criteria.out property and be undefined', () => {
      expect(optimizedUpstreams[4]).to.have.deep.property('criteria.out')
        .and.to.be.undefined
    })
  })

  describe('Evaluate properties optimizations', () => {
    it('Should have property geoip and same length but be different', () => {
      expect(optimizedUpstreams[5]).to.have.deep.property('criteria.in.geoip')
        .and.to.have.lengthOf(geoips.length)
        .and.not.equal(geoips)
    })

    it('Should have property agent and same length but be different', () => {
      expect(optimizedUpstreams[5]).to.have.deep.property('criteria.in.agent')
        .and.to.have.lengthOf(agents.length)
        .and.not.equal(agents)
    })

    it('Should have property path and same length but be different', () => {
      expect(optimizedUpstreams[5]).to.have.deep.property('criteria.in.path')
        .and.to.have.lengthOf(paths.length)
        .and.not.equal(paths)
    })

    it('Should have property regExp in options.rewrite when rewrite is set', () => {
      expect(optimizedUpstreams[6]).to.have.deep.property('upstream.options.rewrite.regExp')
    })

    it('Shouldn\'t have property options.rewrite nor rewrite.regExp when rewrite isn\'t set', () => {
      expect(optimizedUpstreams[5]).to.not.have.deep.property('upstream.options.rewrite')
        .and.to.not.have.deep.property('upstream.options.rewrite.regExp')
    })
  })

  describe('Evaluate performance handling', () => {
    it('Should set performance when undefined', () => {
      expect(config.getPerformance({}))
        .to.have.all.keys('logSlowRequests', 'slowRequestThreshold')
    })

    it('Should set logSlowRequests to true when undefined', () => {
      expect(config.getPerformance({performance: {}}))
        .to.have.property('logSlowRequests')
        .and.to.be.true
    })

    it('Should keep logSlowRequests value when defined (true)', () => {
      expect(config.getPerformance({performance: {logSlowRequests: true}}))
        .to.have.property('logSlowRequests')
        .and.to.be.true
    })

    it('Should keep logSlowRequests value when defined (false)', () => {
      expect(config.getPerformance({performance: {logSlowRequests: false}}))
        .to.have.property('logSlowRequests')
        .and.to.be.false
    })

    it('Should set slowRequestThreshold to 1000 when undefined', () => {
      expect(config.getPerformance({performance: {}}))
        .to.have.property('slowRequestThreshold')
        .and.equal(1000)
    })

    it('Should keep slowRequestThreshold value when defined', () => {
      expect(config.getPerformance({performance: {slowRequestThreshold: 1234}}))
        .to.have.property('slowRequestThreshold')
        .and.equal(1234)
    })
  })
})
