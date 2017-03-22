const EventEmitter = require('events').EventEmitter;
const mixin = require('merge-descriptors');
const clone = require('clone');
const utils = require('./utils');

const Splitter = class BaseSplitter {
  constructor(configuration) {
    if (!utils.config.validate(configuration)) {
      throw new Error('Invalid configuration');
    }
    this.config = clone(configuration);
    this.logger = utils.logger.init(clone(this.config.bunyan));
    mixin(this, EventEmitter.prototype, false);
  }
  getConfiguration() {
    clone(this.config);
  }
  getLogger() {
    return this.logger;
  }
  start() {
    this.emit('application_start');
  }
};

module.exports = Splitter;
