const {expect} = require('chai')
const {config} = require('../lib/utils')

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

const rulesets = {
  first: {
    cookie: [
      {
        name: 'step',
        value: 'in'
      }
    ],
    path: ['/step', '/walk', '/run'],
    bucket: [{min: 0, max: 10}, {min: 45, max: 55}, {min: 80, max: 100}]
  },
  second: {
    cookie: [
      {
        name: 'step',
        value: 'out'
      }
    ],
    agent: ['Chrome', 'Safari'],
    bucket: [{min: 10, max: 45}, {min: 55, max: 80}]
  },
  third: {
    agent: ['Netscape']
  }
}

let firstUp = {
  name: 'firstUp',
  enabled: true,
  criteria: {
    in: {
      ruleset: ['first', 'third']
    },
    out: {
      ruleset: ['second']
    }
  },
  upstream: {
    type: 'serve',
    options: {
      host: 'www.mindera.com'
    }
  }
}

let secondUp = {
  name: 'secondUp',
  enabled: true,
  criteria: {
    in: {
      ruleset: ['second', 'third']
    }
  },
  upstream: {
    type: 'serve',
    options: {
      host: 'www.mindera.com'
    }
  }
}

let thirdUp = {
  name: 'thirdUp',
  enabled: true,
  criteria: {
    in: {
      ruleset: ['second', 'third'],
      agent: ['Firefox', 'Opera', 'Vivaldi']
    }
  },
  upstream: {
    type: 'serve',
    options: {
      host: 'www.mindera.com'
    }
  }
}

let fourthUp = {
  name: 'fourthUp',
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
  upstream: {
    type: 'serve',
    options: {
      host: 'www.mindera.com'
    }
  }
}

let fifthUp = {
  name: 'fifthUp',
  enabled: true,
  upstream: {
    type: 'serve',
    options: {
      host: 'www.mindera.com'
    }
  }
}

let sixthUp = {
  name: 'sixthUp',
  enabled: true,
  criteria: {
    in: {
      geoip: geoips,
      agent: agents,
      path: paths
    }
  },
  upstream: {
    type: 'serve',
    options: {
      host: 'www.mindera.com'
    }
  }
}

let seventhUp = {
  name: 'seventhUp',
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

const getOptimizedUpstream = (upstream) => config.getOptimizedUpstreams({
  pathRegExp: {
    prefix: '^',
    sufix: '([/?].*)?$'
  },
  rulesets,
  upstreams: [upstream]
})[0]

before(() => {
  firstUp = getOptimizedUpstream(firstUp)
  secondUp = getOptimizedUpstream(secondUp)
  thirdUp = getOptimizedUpstream(thirdUp)
  fourthUp = getOptimizedUpstream(fourthUp)
  fifthUp = getOptimizedUpstream(fifthUp)
  sixthUp = getOptimizedUpstream(sixthUp)
  seventhUp = getOptimizedUpstream(seventhUp)
})

describe('Evaluate configuration optimization', () => {
  describe('Evaluate rulesets concatenation', () => {
    describe('Evaluate elimination of ruleset property', () => {
      it('Should not have property in criteria.in', () => {
        expect(firstUp).to.not.have.deep.property('criteria.in.ruleset')
      })

      it('Should not have property in criteria.out', () => {
        expect(firstUp).to.not.have.deep.property('criteria.out.ruleset')
      })
    })


    describe('Evaluate addition of rules to criteria', () => {
      it('Should add rules to criteria in', () => {
        expect(firstUp).to.have.deep.property('criteria.in.cookie')
          .and.equal(rulesets.first.cookie)

        // remember that paths are transformed into a regex
        expect(firstUp).to.have.deep.property('criteria.in.path')
          .and.not.equal(rulesets.first.path)

        expect(firstUp).to.have.deep.property('criteria.in.bucket')
          .and.equal(rulesets.first.bucket)

        // remember that agents are transformed into a regex
        expect(firstUp).to.have.deep.property('criteria.in.agent')
          .and.not.equal(rulesets.third.agent)
      })

      it('Should add rules to criteria out', () => {
        expect(firstUp).to.have.deep.property('criteria.out.cookie')
          .and.equal(rulesets.second.cookie)

        // remember that agents are transformed into a regex
        expect(firstUp).to.have.deep.property('criteria.out.agent')
          .and.not.equal(rulesets.second.agent)

        expect(firstUp).to.have.deep.property('criteria.out.bucket')
          .and.equal(rulesets.second.bucket)
      })
    })

    describe('Evaluate properties overriding', () => {
      it('Should have property from last ruleset', () => {
        expect(secondUp).to.have.deep.property('criteria.in.agent')
          .and.to.have.lengthOf(1)
      })

      it('Should keep property from own criteria and not override from ruleset', () => {
        expect(thirdUp).to.have.deep.property('criteria.in.agent')
          .and.to.have.lengthOf(3)
      })
    })
  })

  describe('Evaluate optimization of properties inside operators', () => {
    describe('Evaluate operator AND', () => {
      it('Should have properties and be optimized', () => {
        expect(fourthUp).to.have.deep.property('criteria.in.and[0].path')
          .and.to.have.lengthOf(paths.length)
          .and.not.equal(paths)
      })

      it('Should have operator and have properties optimized', () => {
        expect(fourthUp).to.have.deep.property('criteria.in.and[1].or[0].path')
          .and.to.have.lengthOf(paths.length)
          .and.not.equal(paths)
      })
    })

    describe('Evaluate operator OR', () => {
      it('Should have properties and be optimized', () => {
        expect(fourthUp).to.have.deep.property('criteria.in.or[0].path')
          .and.to.have.lengthOf(paths.length)
          .and.not.equal(paths)
      })

      it('Should have operator and have properties optimized', () => {
        expect(fourthUp).to.have.deep.property('criteria.in.or[1].and[0].path')
          .and.to.have.lengthOf(paths.length)
          .and.not.equal(paths)
      })
    })
  })

  describe('Evaluate upstream without criteria', () => {
    it('Should have criteria property', () => {
      expect(fifthUp).to.have.property('criteria')
        .and.to.not.be.undefined
    })

    it('Should have criteria.in property and be undefined', () => {
      expect(fifthUp).to.have.deep.property('criteria.in')
        .and.to.be.undefined
    })

    it('Should have criteria.out property and be undefined', () => {
      expect(fifthUp).to.have.deep.property('criteria.out')
        .and.to.be.undefined
    })
  })

  describe('Evaluate properties optimizations', () => {
    it('Should have property geoip and same length but be different', () => {
      expect(sixthUp).to.have.deep.property('criteria.in.geoip')
        .and.to.have.lengthOf(geoips.length)
        .and.not.equal(geoips)
    })

    it('Should have property agent and same length but be different', () => {
      expect(sixthUp).to.have.deep.property('criteria.in.agent')
        .and.to.have.lengthOf(agents.length)
        .and.not.equal(agents)
    })

    it('Should have property path and same length but be different', () => {
      expect(sixthUp).to.have.deep.property('criteria.in.path')
        .and.to.have.lengthOf(paths.length)
        .and.not.equal(paths)
    })

    it('Should have property regExp in options.rewrite when rewrite is set', () => {
      expect(seventhUp).to.have.deep.property('upstream.options.rewrite.regExp')
    })

    it('Shouldn\'t have property options.rewrite nor rewrite.regExp when rewrite isn\'t set', () => {
      expect(sixthUp).to.not.have.deep.property('upstream.options.rewrite')
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
