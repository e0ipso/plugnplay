const PluginManager = require('../../lib/PluginManager');
const PluginTypeLoaderBase = require('../../lib/PluginTypeLoaderBase');
const sinon = require('sinon');

module.exports = {
  setUp(cb) {
    this.manager = new PluginManager({ discovery: { rootPath: './test' } });
    this.manager.register({
      id: 'lorem',
      loader: 'fake.js',
      _pluginPath: 'fake',
    });
    this.manager.check = sinon.spy();
    this.stubs.push(this.manager.check);
    this.loader = new PluginTypeLoaderBase(this.manager, 'lorem');
    this.manager.instantiate('fruit').then((instance) => {
      this.typeInstance = instance;
      cb();
    });
  },
  export(test) {
    test.expect(1);
    test.deepEqual(this.typeInstance, {
      exports: {
        props: ['sugarLevel', 'color', 'size'],
        validate: {},
        plugins: [
          {
            id: 'avocado',
            dependencies: ['mango', 'fruit'],
            _pluginPath: './test/test_plugins/avocado',
            name: 'Avocado',
            description: 'The main ingredient for guacamole.',
            loader: 'customLoader.js',
            type: 'fruit',
            sugarLevel: 'low',
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
          {
            id: 'ripeAvocado',
            loader: '../avocado/customLoader.js',
            dependencies: ['avocado', 'fruit'],
            _pluginPath: './test/test_plugins/ripeAvocado',
            name: 'Ripe Avocado',
            description: 'The main ingredient for *GOOD* guacamole.',
            type: 'fruit',
            sugarLevel: 'medium',
            decorates: 'avocado',
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
  validate(test) {
    test.expect(1);
    this.manager.instantiate('pear').catch((error) => {
      test.strictEqual(
        error.message,
        'The plugin of type fruit is missing properties: sugarLevel, color.',
      );
      test.done();
    });
  },
  _typePluginProperties(test) {
    test.expect(1);
    const loader = new PluginTypeLoaderBase(this.manager, 'lorem');
    test.deepEqual(loader._typePluginProperties(), [
      'props',
      'plugins',
      'validate',
    ]);
    test.done();
  },
};
