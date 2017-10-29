// @flow

import type { PluginTypeLoaderInterface } from '../types/common';

const _ = require('lodash');
const PluginLoaderBase = require('./PluginLoaderBase');

/**
 * @classdesc
 *   Loader for plugins representing types.
 * @class
 *   PluginTypeLoaderBase
 */
class PluginTypeLoaderBase extends PluginLoaderBase implements PluginTypeLoaderInterface {
  /**
   * @inheritDoc
   */
  export(options: Object): Promise<Object> {
    return Promise.resolve({
      props: this.definePluginProperties(),
      plugins: this.findPlugins(),
      // Validates the exports of a plugin based on the properties defined in
      // the type.
      validate: (exports: Object) => {
        const actualProperties = Object.keys(exports);
        const definedProperties = this.definePluginProperties();
        const difference = _.difference(definedProperties, actualProperties);
        if (difference.length !== 0) {
          throw Error(`The plugin of type ${this.descriptor.id} is missing properties: ${difference.join(', ')}.`);
        }
      },
    });
  }

  /**
   * @inheritDoc
   */
  definePluginProperties() {
    throw new Error('You need to override this method in the actual plugin implementation.');
  }

  /**
   * @inheritDoc
   */
  findPlugins() {
    return this.manager.all().filter(({ type }) => type === this.descriptor.id);
  }
}

module.exports = PluginTypeLoaderBase;
