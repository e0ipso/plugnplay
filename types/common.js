// @flow

type PluginDiscoveryConfig = {
  rootPath: string,
  allowsContributed: boolean,
};

export type PluginManagerConfig = {
  discovery: PluginDiscoveryConfig,
};

export type PluginDescriptor = {
  id: string,
  name?: string,
  description?: string,
  loader: string,
  dependencies: Array<string>,
  _pluginPath: string,
};

export interface PluginManagerInterface {
  /**
   * Finds all the plugins based on the configuration options.
   *
   * @return {Promise.<PluginDescriptor[]>}
   *   The list of descriptors for the plugins in the system.
   */
  discover(): Promise<Array<PluginDescriptor>>;

  /**
   * Finds the plugin and does a dynamic require to whatever the plugin exports.
   *
   * @param {string} pluginId
   *   The plugin ID.
   * @param {Object} options
   *   Run-time options to configure your exports.
   *
   * @return {Promise.<Object>}
   *   An object containing the exported functionality.
   */
  instantiate(pluginId: string, options: Object): Promise<Object>;

  /**
   * Registers a plugin descriptor in the manager.
   *
   * This method is used to manually register a plugin at run-time. Uses for
   * this are dynamic plugins.
   *
   * @param {PluginDescriptor} descriptor
   *   The plugin descriptor to register.
   *
   * @return {boolean}
   *   TRUE if the descriptor was registered. FALSE if the descriptor was
   *   already registered.
   */
  register(descriptor: Object): boolean;

  /**
   * Gets the descriptor by an ID.
   *
   * @param {string} pluginId
   *   The plugin ID.
   *
   * @return {PluginDescriptor}
   *   The descriptor if it exists.
   */
  get(pluginId: string): ?PluginDescriptor;

  /**
   * Checks if a given descriptor is valid by checking dependencies.
   *
   * @param {string} pluginId
   *   The ID of the plugin to check.
   *
   * @throws {Error}
   *   When one of the dependencies is missing.
   */
  check(pluginId: string): void;
}

export interface PluginLoaderInterface {
  /**
   * Exports the plugin content.
   *
   * @param {Object} options
   *   Run-time options to configure your exports.
   *
   * @return {Object}
   *   An object with the functionality.
   */
  export(options: Object): Object;
}
