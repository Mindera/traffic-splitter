const fs = require('fs');

const config = JSON.parse(fs.readFileSync('./conf/config.json'));

const Splitter = require('./lib/splitter');

try {
  const splitter = new Splitter(config);
  splitter.once('application_start', () => {
    console.log('application_start');
  });
  // start should only be called after adding all events, middlewares and rules
  // start can only be called once in each instance
  splitter.start();
  splitter.start();
} catch (e) {
  console.log(`${e.name}: ${e.message}`);
}
