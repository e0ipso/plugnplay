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
