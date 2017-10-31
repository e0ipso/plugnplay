# plugnplay

[![Mateu Aguiló Bosch (e0ipso)](https://img.shields.io/badge/♥-e0ipso-green.svg?style=flat-square)](http://mateuaguilo.com/)
[![Travis](https://img.shields.io/travis/e0ipso/plugnplay.svg?style=flat-square)](https://travis-ci.org/e0ipso/plugnplay/)
[![Coverage Status](https://img.shields.io/coveralls/github/e0ipso/plugnplay/master.svg?style=flat-square)](https://coveralls.io/github/e0ipso/plugnplay?branch=master)
[![Last Commit](https://img.shields.io/github/last-commit/e0ipso/plugnplay.svg?style=flat-square)](https://github.com/e0ipso/plugnplay)
[![David Dependency Management](https://img.shields.io/david/e0ipso/plugnplay.svg?style=flat-square)](https://david-dm.org/e0ipso/plugnplay)
[![Node](https://img.shields.io/node/v/plugnplay.svg?style=flat-square)](http://npmjs.com/package/plugnplay)

## Summary
_Plug'n'Play_ is a simple plugin system that will allow you leverage polymorphism.

**Example 1:** Imagine a service that needs to process some data and store it in S3. The piece that stores the data
could be a plugin, and you could have a plugin that writes to S3, another that writes to the local
filesystem and another that dumps the data in the console. This way you could use configuration
files to say:

> OK, run the application locally but don't upload to S3 save to my disk so I can debug
and inspect the end result.

You would only need to change `storePlugin` from `'s3'` to `'disk'`.

**Example 2:** Your application deals with user objects, but a user can be initialized from their
public GitHub data, AboutMe, etc. You can declare a plugin type 'user' and then have plugins for
'user-from-github', 'user-from-aboutme', etc.
[More on this example](https://github.com/e0ipso/plugnplay#why-does-export-return-a-promise).

**Example 3:** In a data pipeline application you want to apply an unknown number of transformations
to your data. Similar to a middleware you want to chain _data processors_. A data processor exposes
a function that applies to your specific data and provides a specific output. Each data processor
will be a plugin instance. For instance you may want to chain 'validate-against-schema',
'remove-mb-characters', 'log-to-splunk'. Data processors can be defined in your application or can
be discovered in 3rd party modules.

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

## FAQ
### Why not just node modules that you include with a `require`?
Plugins offer several features that you can't easily obtain with `require('./some/code')`:
  * 3rd party modules can provide plugins that your app can discover for feature enhancements.
  * Typed plugins ensure expectations on what is returned.
  * Plugins can contain additional metadata in `plugnplay.yml`.
  * Plugins can be registered at run-time.
  * Plugins can return a promise. This allows you to do _async requires_.
  * Plugins are auto-discovered and instantiated by ID. Requiring a plugin does not depend on the
  directory you are in.
### Can all the pluggability resolve at build time?
Yes, it can! Well no, but almost. Since the plug-in dependency resolution can also happen over I/O
you will need to resolve a promise. This is how you'd do almost-build-time pluggability:

```js
// app.js cares about pluginWithIO and plugin2 (plugin0 is also added via dependencies).

const { PluginManager } = require('plugnplay');

const manager = new PluginManager();

Promise.all([
  manager.get('pluginWithIO'),
  manager.get('plugin2'),
])
// All plugins are found and cached at this point.
.then(([pluginWithIO, plugin2]) => {
  // Your app code that depends on plugins happen here.
  doSomeCoolStuff(pluginWithIO, plugin2);
});
```

### Can external modules provide plugins?
They can! Just by declaring the plugin, anyone can find that module in the filesystem. If your
application needs plugins provided by 3rd party modules, make sure to enable the `allowsContributed`
option.
### What's the impact on performance of the plugin auto discovery?
If you include plugins from 3rd party modules and your `node_modules` directory is very big, then it
may take a while to scan all the files. If that's your case reduce the scope of the scan with the
`rootPath` option.

For instance:
```js
const { PluginManager } = require('plugnplay');

const manager = new PluginManager({
  discovery: {
    allowsContributed: true,
    rootPath: '+(./lib|./node_modules/foo_*|./node_modules/bar)'
  }
});
```

See more path options in the [Glob](https://github.com/isaacs/node-glob#readme) project.

### Why does `export()` return a `Promise`?
The recommendation is that your plugin instance is fully loaded and ready to be used. That's why it
can accept configuration options. That is also the reason why `export()` returns a promise, so it
can execute async operations to fully load the exported data.

For instance:
```js
/**
 * 'user-from-github' is a plugin of type 'user'.
 * 
 * It contains the name, username, image and a google maps object about the user. It also contains a
 * connection to the database to read/write users.
 */
module.exports = UserFromGitHubLoader extends PluginLoaderBase {
  exports(options = {}) {
    const promises = [
      request(`https://api.github.com/users/${options.username}`),
      new SqlConnection('foo', 'bar')
    ];
    return Promise.all(promises)
      .then(([data, storage]) => ({
        image: data.avatar_url,
        username: options.username,
        map: new GoogleMaps(data.location),
        name: data.name,
        storage,
      }));
  }
}
```

This way your User plugin can be initialized synchronously from your apps data, or asynchronously by
using GitHub's data. You don't care where the info came from, you just use the plugin instance!

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
    return Promise.resolve({
      logger: console.log,
    });
  }
};
```

This loader will export the `console.log` function as the `logger` property in the exported
functionality.

### Typed Plugins
A common use case is to have plugins that all conform to the same shape. For that we can use typed
plugins. A typed plugin is a plugin that has the `type` key populated. The `type` contains the id
of another plugin, this other plugin is the _type plugin_. Type plugins are regular plugins with the
only requirement that their loader extends from `PluginTypeLoaderBase`.

Look at the example plugins in the `test` folder: [fruit](/test/test_plugins/fruit) is the type for
[pear](/test/test_plugins/pear) (the typed plugin).

#### Fruit
##### plugnplay.yml
```yaml
id: fruit
name: Fruit
description: A type of delicious food.
loader: loader.js
```

```js
const { PluginTypeLoaderBase } = require('plugnplay');

module.exports = class FruitLoader extends PluginTypeLoaderBase {
  /**
   * @inheritDoc
   */
  definePluginProperties() {
    // This defines the names of the properties that plugins of this type will expose. If a plugin
    // of this type doesn't expose any of these, an error is generated.
    return ['isBerry', 'isGood', 'size'];
  }
};
```

#### Pear
```yaml
id: pear
name: Pear
description: A kind of fruit
loader: loader.js
# The ID of the Fruit plugin.
type: fruit
```

### Decorated Plugins
Decorated plugins are a great way to define plugins that are driven only by the `plugnplay.yml`
file.

For an example of a decorated plugin see the [Ripe Avocado plugin](/test/test_plugins/ripeAvocado).

## Options
### PluginManager
```flow js
type PluginManagerConfig = {
  discovery: {
    rootPath: string,
    allowsContributed: boolean,
  },
};
```
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
