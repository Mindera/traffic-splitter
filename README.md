# traffic-splitter [![NPM version][npm-image]][npm-url] [![build status][travis-image]][travis-url]

traffic-splitter is a component that allows for HTTP traffic to be directed to an appropriate upstream depending on the request matching certain criteria.

<br>

How it really works? It's not magic..

![architecture](http://trafficsplitter.io/images/architecture.png)

<br>

## Getting started
There are two ways you can use this package. Both need to be provided with a configuration.

Free configuration samples in [here](https://github.com/Mindera/traffic-splitter/tree/configuration-samples).

### CLI
```shell
npm i traffic-splitter -g
traffic-splitter -c configuration.js
```

Provided configuration can be a json or a js file.
```javascript
// in case config is a js file wrap it in:
module.exports = {}
```

### API
```shell
npm i traffic-splitter
```

```javascript
const TrafficSplitter = require('traffic-splitter')
const splitter = new TrafficSplitter(/*your configuration*/) // provide a configuration object
splitter.start()
```

<br>

And BOOM, splitter is running!
> **localhost:PORT/healthcheck**

<br>

## More... so much more
What about docs?

Sure thing! Here you go... [trafficsplitter.io](http://trafficsplitter.io)

<br>

<img src="http://trafficsplitter.io/images/logos/png/tf-original.png" alt="logo" width="250" height="250" />

[npm-image]: https://img.shields.io/npm/v/traffic-splitter.svg?style=flat-square
[npm-url]: https://www.npmjs.com/package/traffic-splitter
[travis-image]: https://travis-ci.org/Mindera/traffic-splitter.svg?branch=master
[travis-url]: https://travis-ci.org/Mindera/traffic-splitter
