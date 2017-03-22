const EventEmitter = require('events');
const clone = require('clone');
const utils = require('./utils');

const Splitter = class BaseSplitter extends EventEmitter {
  constructor(configuration) {
    super();
    if (!utils.config.validate(configuration)) {
      throw new Error('Invalid configuration');
    }
    this.config = clone(configuration);
    this.logger = utils.logger.init(clone(this.config.bunyan));
  }
  getConfiguration() {
    return clone(this.config);
  }
  getLogger() {
    return this.logger;
  }
  start() {
    this.emit('application_start');
    this.start = () => {};
  }
};

module.exports = Splitter;
