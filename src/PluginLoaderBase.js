// @flow

import type {
  PluginManagerInterface,
  PluginLoaderInterface,
} from '../types/common';

/**
 * @classdesc
 *   A base class to detect properly loaded plugins.
 * @class
 *   PluginBase
 */
class PluginLoaderBase implements PluginLoaderInterface {
  manager: PluginManagerInterface;
  pluginId: string;

  /**
   * Creates a PluginLoaderBase object.
   *
   * @param {PluginManagerInterface} manager
   *   The manager.
   * @param {string} pluginId
   *   The plugin ID.
   */
  constructor(manager: PluginManagerInterface, pluginId: string) {
    this.manager = manager;
    this.pluginId = pluginId;
    // Validate the plugin. Throws an exception if it's invalid.
    this.manager.check(pluginId);
  }

  /**
   * @inheritDoc
   */
  export(options: Object): Object {
    throw new Error('You need to override this method in the actual plugin implementation.');
  }
}

module.exports = PluginLoaderBase;
