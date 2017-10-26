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
