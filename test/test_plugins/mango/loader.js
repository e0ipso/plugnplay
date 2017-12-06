const PluginLoaderBase = require('../../../lib/PluginLoaderBase');

module.exports = class MangoLoader extends PluginLoaderBase {
  /**
   * @inheritDoc
   */
  exportSync(options) {
    return 'FAILS!';
  }
};
