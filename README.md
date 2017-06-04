Traffic Splitter
==

Traffic Splitter is a component that allows for HTTP traffic to be directed to an appropriate upstream depending on the request matching certain criteria.

How it really works? It's not magic..

![architecture](https://cloud.githubusercontent.com/assets/12852058/26765165/5faa2eb8-496e-11e7-9a06-718519844875.png)

## Getting started
> npm install traffic-splitter --save // yet not available

```javascript
const TrafficSplitter = require('traffic-splitter')
const splitter = new TrafficSplitter(/*your configuration*/)
splitter.start()
```
And BOOM, splitter is running!
> localhost:PORT/healthcheck

## More... so much more
This is awesome! Please give me some examples, how-to's, configuration samples and documentation!

Sure thing! Here you go... [trafficsplitter.io](http://trafficsplitter.io).
