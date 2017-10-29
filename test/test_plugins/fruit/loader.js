const PluginTypeLoaderBase = require('../../../lib/PluginTypeLoaderBase');

module.exports = class FruitLoader extends PluginTypeLoaderBase {
  /**
   * @inheritDoc
   */
  definePluginProperties() {
    return ['sugarLevel', 'color', 'size'];
  }
};
