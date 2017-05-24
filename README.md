Traffic Splitter
==

Traffic Splitter is a component that allows for HTTP traffic to be directed to an appropriate upstream depending on the request matching certain criteria.

How it really works? It's not magic..

[![Traffic Splitter](https://photos-1.dropbox.com/t/2/AACen0fTStX5H-S-usUITXcA7upuu3K-QlA1PjrTZfEgcQ/12/226347707/png/32x32/1/_/1/2/Traffic%20Splitter.png/EIqv9akBGI3e-AEgBygH/TJnSk7V6AIGTed1nXtJUj-89P1698amWyf71CmpOAcg?size=1280x960&size_mode=3)](https://www.mindera.com)

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
