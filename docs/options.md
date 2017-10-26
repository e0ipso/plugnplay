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
