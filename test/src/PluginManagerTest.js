const PluginManager = require('../../lib/PluginManager');
const sinon = require('sinon');
const requireSubvert = require('require-subvert')(__dirname);

module.exports = {
  setUp(cb) {
    this.manager = new PluginManager({
      discovery: {
        rootPath: './test',
        allowsContributed: false,
      },
    });
    cb();
  },
  discover(test) {
    test.expect(2);
    this.manager.discover()
      .then((descriptors) => {
        const expected = [
          {
            id: 'avocado',
            dependencies: ['mango'],
            _pluginPath: './test/test_plugins/avocado',
            name: 'Avocado',
            description: 'The main ingredient for guacamole.',
            loader: 'loader.js',
          },
          {
            id: 'invalid_loader',
            dependencies: [],
            _pluginPath: './test/test_plugins/invalid_loader',
            name: 'Invalid Loader',
            loader: 'loader.js',
          },
          {
            id: 'mango',
            dependencies: [],
            _pluginPath: './test/test_plugins/mango',
            name: 'Mango',
            description: 'It\'s an orange sweet oval.',
            loader: 'loader.js',
          },
        ];
        test.deepEqual(descriptors, expected);
        this.manager.discover()
          .then((cachedDescriptors) => {
            test.deepEqual(cachedDescriptors, expected);
            test.done();
          });
      });
  },
  discoverInvalid(test) {
    test.expect(2);
    let manager = new PluginManager({ discovery: { rootPath: 'foo\n\0c' } });
    manager._globExpression = sinon.stub().callsFake(() => 42);
    this.stubs.push(manager._globExpression);
    manager.discover()
      .catch((error) => {
        test.deepEqual(error.message, 'glob pattern string required');
        // Now force an error in the glob execution.
        const stub = sinon.stub().callsFake((p, cb) => cb('Err!'));
        requireSubvert.subvert('glob', stub);
        manager = new (requireSubvert.require('../../lib/PluginManager'))();
        manager.discover()
          .catch((err) => {
            test.equal(err, 'Err!');
            requireSubvert.cleanUp();
            test.done();
          });
      });
  },
  register(test) {
    test.expect(3);
    let registered = this.manager.register({
      id: 'lorem',
      name: 'Lorem',
      loader: 'loader.js',
    });
    test.ok(!registered);
    this.manager.register({
      id: 'lorem',
      name: 'Lorem',
      loader: 'loader.js',
      _pluginPath: './test/test_plugins',
    });
    test.deepEqual(this.manager.registeredDescriptors, [{
      id: 'lorem',
      dependencies: [],
      _pluginPath: './test/test_plugins',
      name: 'Lorem',
      loader: 'loader.js',
    }]);
    registered = this.manager.register({
      id: 'lorem',
      name: 'Lorem',
      loader: 'loader.js',
      _pluginPath: './test/test_plugins',
    });
    test.ok(!registered);
    test.done();
  },
  instantiate(test) {
    test.expect(2);
    Promise.all([
      this.manager.instantiate('avocado', { colorType: 'hex' }),
      this.manager.instantiate('avocado', { colorType: 'name' }),
    ])
      .then((fruits) => {
        test.deepEqual(fruits[0], {
          sugarLevel: 'low',
          color: '#33AA33',
          size: 'medium',
        });
        test.equal(fruits[1].color, 'green');
        test.done();
      });
  },
  instantiateErrorNonObject(test) {
    test.expect(1);
    const manager = new PluginManager({ discovery: { rootPath: './test' } });
    manager.instantiate('mango')
      .catch((error) => {
        test.equal(error.message, 'The plugin "mango" did not return an object after loading.');
        test.done();
      });
  },
  instantiateInexisting(test) {
    test.expect(1);
    this.manager.instantiate('fail')
      .catch((error) => {
        test.equal(
          error.message,
          'Unable to find plugin with ID: "fail". Available plugins are: avocado, invalid_loader, mango'
        );
        test.done();
      });
  },
  instantiateNonLoader(test) {
    test.expect(1);
    this.manager.instantiate('invalid_loader')
      .catch((error) => {
        test.equal(
          error.message,
          'Unable to find or execute the plugin loader for plugin "invalid_loader".'
        );
        test.done();
      });
  },
  check(test) {
    test.expect(1);
    this.manager.discover()
      .then(() => {
        test.doesNotThrow(() => this.manager.check('avocado'), 'Error');
        test.done();
      });
  },
  checkMissing(test) {
    test.expect(1);
    this.manager.discover()
      .then(() => {
        test.throws(() => this.manager.check('fail'), 'Error');
        test.done();
      });
  },
  checkMissingDep(test) {
    test.expect(1);
    this.manager.register({
      id: 'missing_deps',
      loader: 'loader.js',
      _pluginPath: 'foo',
      dependencies: ['fail']
    });
    test.throws(() => this.manager.check('missing_deps'), 'Error');
    test.done();
  },
};
