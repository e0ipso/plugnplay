const PluginLoaderFactory = require('../../lib/PluginLoaderFactory');

module.exports = {
  getClass(test) {
    test.expect(2);
    const clss = PluginLoaderFactory.getClass({
      _pluginPath: './test/src',
      loader: 'PluginLoaderFactoryTest.js',
    });
    test.ok(clss.getClass);
    test.throws(() => PluginLoaderFactory.getClass({
      _pluginPath: '.',
      loader: 'fail.js',
    }), 'Error');
    test.done();
  },
};
