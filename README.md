# plugnplay

[![Mateu Aguiló Bosch (e0ipso)](https://img.shields.io/badge/♥-e0ipso-green.svg?style=flat-square)](https://mateuaguilo.com/)
[![Travis](https://img.shields.io/travis/e0ipso/plugnplay.svg?style=flat-square)](https://travis-ci.org/e0ipso/plugnplay/)
[![Coverage Status](https://img.shields.io/coveralls/github/e0ipso/plugnplay/master.svg?style=flat-square)](https://coveralls.io/github/e0ipso/plugnplay?branch=master)
[![David Dependency Management](https://img.shields.io/david/e0ipso/plugnplay.svg?style=flat-square)](https://david-dm.org/e0ipso/plugnplay)
[![David Dependency Management (dev)](https://img.shields.io/david/dev/e0ipso/plugnplay.svg?style=flat-square)](https://david-dm.org/dev/e0ipso/plugnplay#info=devDependencies&view=table)
[![Node](https://img.shields.io/node/v/plugnplay.svg?style=flat-square)](http://npmjs.com/package/plugnplay)
[![NPM](https://img.shields.io/npm/v/plugnplay.svg?style=flat-square)](http://npmjs.com/package/plugnplay)
[![Greenkeeper](https://img.shields.io/badge/Greenkeeper-enabled-brightgreen.svg?style=flat-square)](https://greenkeeper.io/)

## Summary
_Plug'n'Play_ is a simple plugin system that will allow you leverage polymorphism.

**Example:** Imagine a service that needs to process some data and store it in S3. The piece that stores the data
could be a plugin, and you could have a plugin that writes to S3, another that writes to the local
filesystem and another that dumps the data in the console. This way you could use configuration
files to say:

> OK, run the application locally but don't upload to S3 save to my disk so I can debug
and inspect the end result.

You would only need to change `storePlugin` from `'s3'` to `'disk'`.    

### Setup
Install the module as usual with either:
  * Yarn: `yarn add plugnplay`
  * NPM: `npm install --save plugnplay`

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

## Create a Plugin
A plugin is just a directory that contains a `plugnplay.yml` file and a loader. For instance:

```
plugin1
 |_ plugnplay.yml
 |_ loader.js
```

**Example:** Imagine the following plugin that exports a logger function.

### The Plugin Descriptor
The plugin descriptor is a YAML file that contains basic information about a plugin.
Consider the following example:

```yaml
# /path/to/plugin1/plugnplay.yml
id: plugin1
name: First Plugin
description: This is the first plugin to be tested.
loader: loader.js # This is the file that contains the plugin loader.
```

### The Loader
The loader is a very simple class that will export an object with the actual functionality to
export.
Consider the following example:

```js
const { PluginLoaderBase } = require('plugnplay');

module.exports = class FirstPluginLoader extends PluginLoaderBase {
  /**
   * @inheritDoc
   */
  export() {
    return {
      logger: console.log,
    }
  }
};
```

This loader will export the `console.log` function as the `logger` property in the exported
functionality.

## Options
```flow js
type PluginManagerConfig = {
  discovery: {
    rootPath: string,
    allowsContributed: boolean,
  },
};
```
### PluginManager
#### `discovery`
  - `rootPath` _string_ (`'.'`): The root path where to find all plugins. Use this setting to restrict where
  the plugin manager searches for plugins, this improves discovery performance.
  - `allowsContributed` _boolean_ (`true`): Set to `false` to exclude the `node_modules` directory
  from the discovery scan.
### Plugin Descriptor
The plugin descriptor is the `plugnplay.yml` file.
```flow js
export type PluginDescriptor = {
  id: string,
  name?: string,
  description?: string,
  loader: string,
  dependencies: Array<string>,
  _pluginPath: string,
};
```
#### `id`
The plugin ID. This is used to identify the plugin while loading and discovering. **Required**.
#### `name`
The plugin human readable name.
#### `description`
The plugin description. Describes what the plugin does.
#### `loader`
The name of the file that contains the loader. The loader needs to extend `PluginLoaderBase`. **Required**.
#### `dependencies`
A list of plugin IDs this plugins requires for correct functioning.

## Contributors

[![Mateu (e0ipso)](https://avatars.githubusercontent.com/u/1140906?s=130)](https://github.com/e0ipso)
---
[Mateu (e0ipso)](https://github.com/e0ipso)
## License

GPL-2.0 @ [Mateu (e0ipso)](https://github.com/e0ipso)
