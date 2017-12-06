// @flow

import type {
  PluginManagerInterface,
  PluginLoaderInterface,
  PluginDescriptor,
  PluginInstance,
} from '../types/common';

const _ = require('lodash');

/**
 * @classdesc
 *   A base class to detect properly loaded plugins.
 * @class
 *   PluginBase
 */
class PluginLoaderBase implements PluginLoaderInterface {
  manager: PluginManagerInterface;
  descriptor: PluginDescriptor;
  pluginType: ?PluginInstance;

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
    const descriptor = manager.get(pluginId);
    if (!descriptor) {
      throw Error('Invalid plugin ID');
    }
    this.descriptor = descriptor;
    // Validate the plugin. Throws an exception if it's invalid.
    this.manager.check(pluginId);
  }

  /**
   * @inheritDoc
   */
  export(options: Object): Promise<Object> {
    // Default to the sync require.
    return Promise.resolve(this.exportSync(options));
  }

  /**
   * @inheritDoc
   */
  exportSync(options: Object): Object { // eslint-disable-line no-unused-vars
    throw new Error('You need to override this method in the actual plugin implementation.');
  }

  /**
   * Does the actual export with some postprocessing actions.
   *
   * @param {Object} options
   *   Run-time options to configure your exports.
   *
   * @return {Object}
   *   An object with the functionality.
   *
   * @private
   */
  _doExport(options: Object): Promise<Object> {
    return this.export(options)
      .then((exports) => {
        if (!this.descriptor.type) {
          return exports;
        }
        return this.manager.instantiate(this.descriptor.type, {})
          .then((pluginType) => {
            // Validate the exports.
            pluginType.exports.validate(exports);
            return _.pick(exports, pluginType.exports.props);
          });
      });
  }

  /**
   * Does the actual require with some postprocessing actions.
   *
   * @param {Object} options
   *   Run-time options to configure your exports.
   *
   * @return {Object}
   *   An object with the functionality.
   *
   * @private
   */
  _doExportSync(options: Object): Object {
    const exports = this.exportSync(options);
    if (!this.descriptor.type) {
      return exports;
    }
    const pluginType = this.manager.require(this.descriptor.type, {});
    // Validate the exports.
    pluginType.exports.validate(exports);
    return _.pick(exports, pluginType.exports.props);
  }
}

module.exports = PluginLoaderBase;
