// @flow

import type { PluginLoaderInterface, PluginDescriptor } from '../types/common';

const Factory = require('easy-factory');
const path = require('path');

/**
 * @classdesc
 *   Factory to load the correct plugin.
 */
class PluginLoaderFactory extends Factory {
  /**
   * Decide which class to instantiate based on the context.
   *
   * @param {*} context
   *   The information we base on to decide which object to return.
   *
   * @throws Error
   *   If no class could be found.
   *
   * @return {function}
   *   The class to instantiate.
   */
  static getClass(context: PluginDescriptor): Class<PluginLoaderInterface> {
    const descriptor = context;
    // Once we have found the descriptor that for the required plugin, load
    // the exports.
    const loaderPath: string = path.relative(
      __dirname,
      path.resolve(descriptor._pluginPath, descriptor.loader),
    );
    try {
      return require(loaderPath);
    } catch (e) {
      throw new Error(
        `Unable to find or execute the plugin loader for plugin "${descriptor.id}".\n${e.message}.`,
      );
    }
  }
}

module.exports = PluginLoaderFactory;
