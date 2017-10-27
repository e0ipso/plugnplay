// @flow

import type { PluginTypeLoaderInterface } from '../types/common';

const PluginLoaderBase = require('./PluginLoaderBase');

class PluginTypeLoaderBase extends PluginLoaderBase implements PluginTypeLoaderInterface {
  /**
   * @inheritDoc
   */
  export(options: Object): Object {
    return {
      props: this.definePluginProperties(),
      plugins: this.findPlugins(),
    };
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
    return this.manager.all().filter(({ type }) => type === this.pluginId);
  }
}

module.exports = PluginTypeLoaderBase;
