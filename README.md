Traffic Splitter
==

Traffic Splitter is a component that allows for HTTP traffic to be directed to an appropriate upstream depending on the request matching certain criteria.

<br>

How it really works? It's not magic..

![architecture](https://cloud.githubusercontent.com/assets/12852058/26765165/5faa2eb8-496e-11e7-9a06-718519844875.png)

<br>

## Getting started
There are two ways you can use this package and both need to be provided with a configuration.

Personalize your own [configuration](http://trafficsplitter.io/#configuration) or go [here](http://trafficsplitter.io/#ready-to-go-configuration) for a sample.

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
This is awesome! Please give me some examples, how-to's, configuration samples and documentation!

Sure thing! Here you go... [trafficsplitter.io](http://trafficsplitter.io)
