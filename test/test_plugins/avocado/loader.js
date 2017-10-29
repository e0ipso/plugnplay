const PluginLoaderBase = require('../../../lib/PluginLoaderBase');

module.exports = class AvocadoLoader extends PluginLoaderBase {
  /**
   * @inheritDoc
   */
  export(options) {
    return Promise.resolve({
      sugarLevel: 'low',
      color: options.colorType === 'hex' ? '#33AA33' : 'green',
      size: 'medium',
    });
  }
};
