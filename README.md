Traffic Splitter
==

Traffic Splitter is a component that allows for HTTP traffic to be directed to an appropriate upstream depending on the request matching certain criteria.

How it really works? It's not magic..

[![Traffic Splitter](https://cloud.githubusercontent.com/assets/12852058/26411570/15979fe6-409e-11e7-85e9-440f87e1ebad.png)](https://www.mindera.com)

#### Getting started
> npm install traffic-splitter --save

```javascript
const TrafficSplitter = require('traffic-splitter') // yet not available
const splitter = new TrafficSplitter(/*your configuration*/)
splitter.start()
```
And BOOM, splitter is running!
> localhost:PORT/healthcheck

#### Simple example


#### Upstreams

#### Criteria

#### Configuration
  1. [api](http://trafficsplitter.io/configuration/api) *
  2. [bunyan](http://trafficsplitter.io/configuration/bunyan) *
  3. [browserId](http://trafficsplitter.io/configuration/browserId) *
  4. [domains](http://trafficsplitter.io/configuration/domains)
  5. [cors](http://trafficsplitter.io/configuration/cors)
  6. [rulesets](http://trafficsplitter.io/configuration/rulesets)
  7. [upstreams](http://trafficsplitter.io/configuration/upstreams) *

\* - required

#### Other cool stuff you can do
  - [Have many instances running on different ports](http://trafficsplitter.io/instances)
  - [Add request middlewares](http://trafficsplitter.io/middlewares)
  - [Override default rules](http://trafficsplitter.io/default-rules)
  - [Add custom rules](http://trafficsplitter.io/custom-rules)
  - [Handle many events](http://trafficsplitter.io/events)
  - [Use rulesets to avoid repeated criteria](http://trafficsplitter.io/rulesets)
