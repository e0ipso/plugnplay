const PluginLoaderBase = require('../../../lib/PluginLoaderBase');

module.exports = class PearLoader extends PluginLoaderBase {
  /**
   * @inheritDoc
   */
  export(options) {
    return {
      isBerry: false,
      isGood: true,
      size: 'medium',
    };
  }
};
