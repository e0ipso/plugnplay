## Usage
Imagine that you want to use a different logger for your local environment than from the production
environment. You want to use console.log in your local and you want to send to Logstash in
production. You could do something like:

```js
const config = require('config');
const { PluginManager } = require('plugnplay');

const manager = new PluginManager();

manager.instantiate(config.get('loggerPlugin'), config.get('loggerOptions'))
  .then(({ logger }) => {
    logger('We are using the logger provided by the plugin!');
  })
  .catch((e) => {
    console.error(e);
  });
```
