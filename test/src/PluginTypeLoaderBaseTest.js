const PluginManager = require('../../lib/PluginManager');
const PluginTypeLoaderBase = require('../../lib/PluginTypeLoaderBase');
const sinon = require('sinon');

module.exports = {
  setUp(cb) {
    const manager = new PluginManager({ discovery: { rootPath: './test' } });
    manager.check = sinon.spy();
    this.stubs.push(manager.check);
    this.loader = new PluginTypeLoaderBase(manager, 'lorem');
    manager.instantiate('fruit')
      .then((instance) => {
        this.typeInstance = instance;
        cb();
      });
  },
  export(test) {
    test.expect(1);
    test.deepEqual(this.typeInstance, {
      exports: {
        props: ['isBerry', 'isGood', 'size'],
        plugins: [
          {
            id: 'avocado',
            dependencies: ['mango', 'fruit'],
            _pluginPath: './test/test_plugins/avocado',
            name: 'Avocado',
            description: 'The main ingredient for guacamole.',
            loader: 'loader.js',
            type: 'fruit',
          },
          {
            id: 'pear',
            dependencies: ['fruit'],
            _pluginPath: './test/test_plugins/pear',
            name: 'Pear',
            description: 'A kind of fruit',
            loader: 'loader.js',
            type: 'fruit',
          },
        ],
      },
      descriptor: {
        id: 'fruit',
        dependencies: [],
        _pluginPath: './test/test_plugins/fruit',
        name: 'Fruit',
        description: 'A type of delicious food.',
        loader: 'loader.js',
      },
    });
    test.done();
  },
  definePluginProperties(test) {
    test.expect(1);
    test.throws(() => this.loader.definePluginProperties(), 'Error');
    test.done();
  },
};
