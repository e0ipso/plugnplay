// @flow

import type {
  PluginDescriptor,
  PluginTypeLoaderInterface,
} from '../types/common';

const _ = require('lodash');
const PluginLoaderBase = require('./PluginLoaderBase');

/**
 * @classdesc
 *   Loader for plugins representing types.
 * @class
 *   PluginTypeLoaderBase
 */
class PluginTypeLoaderBase
  extends PluginLoaderBase
  implements PluginTypeLoaderInterface
{
  /**
   * @inheritDoc
   */
  exportSync(options: Object): Object {
    // eslint-disable-line no-unused-vars
    return {
      props: this.definePluginProperties(),
      plugins: this.findPlugins(),
      // Validates the exports of a plugin based on the properties defined in
      // the type.
      validate: (exports: Object) => {
        const actualProperties = Object.keys(exports);
        const definedProperties = this.definePluginProperties();
        const difference = _.difference(definedProperties, actualProperties);
        if (difference.length !== 0) {
          throw Error(
            `The plugin of type ${
              this.descriptor.id
            } is missing properties: ${difference.join(', ')}.`,
          ); // eslint-disable-line max-len
        }
      },
    };
  }

  /**
   * @inheritDoc
   */
  definePluginProperties() {
    throw new Error(
      'You need to override this method in the actual plugin implementation.',
    );
  }

  /**
   * @inheritDoc
   */
  findPlugins(): PluginDescriptor[] {
    return [...this.manager.all()].filter(
      ({ type }) => type === this.descriptor.id,
    );
  }

  /**
   * Helper function to get the properties of a type plugin.
   *
   * This is useful if the plugins of a given type are plugins types in turn.
   *
   * @returns {string[]}
   *   The list of properties in a type plugin.
   *
   * @private
   */
  _typePluginProperties() {
    return ['props', 'plugins', 'validate'];
  }
}

module.exports = PluginTypeLoaderBase;
