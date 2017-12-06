const PluginManager = require('../../lib/PluginManager');
const sinon = require('sinon');
const requireSubvert = require('require-subvert')(__dirname);

const discoveryTestHelper = (manager, test, isAssync) => {
  test.expect(2);
  const doAssert = (descriptors) => {
    const expected = [
      {
        id: 'avocado',
        loader: 'customLoader.js',
        dependencies: ['mango', 'fruit'],
        _pluginPath: './test/test_plugins/avocado',
        name: 'Avocado',
        description: 'The main ingredient for guacamole.',
        type: 'fruit',
        sugarLevel: 'low',
      },
      {
        id: 'fruit',
        loader: 'loader.js',
        dependencies: [],
        _pluginPath: './test/test_plugins/fruit',
        name: 'Fruit',
        description: 'A type of delicious food.',
      },
      {
        id: 'invalid_loader',
        loader: 'loader.js',
        dependencies: [],
        _pluginPath: './test/test_plugins/invalid_loader',
        name: 'Invalid Loader',
      },
      {
        id: 'mango',
        loader: 'loader.js',
        dependencies: [],
        _pluginPath: './test/test_plugins/mango',
        name: 'Mango',
        description: 'It\'s an orange sweet oval.',
      },
      {
        id: 'pear',
        loader: 'loader.js',
        dependencies: ['fruit'],
        _pluginPath: './test/test_plugins/pear',
        name: 'Pear',
        description: 'A kind of fruit',
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
    ];
    test.deepEqual([...descriptors], expected);
    // Execute one method or the other depending if it's assync or not.
    if (isAssync) {
      return manager.discover()
        .then((cachedDescriptors) => {
          test.deepEqual([...cachedDescriptors], expected);
          test.done();
        });
    }
    test.deepEqual([...manager.discoverSync()], expected);
    test.done();
  };
  // Execute one method or the other depending if it's assync or not.
  if (isAssync) {
    return manager.discover().then(doAssert);
  }
  doAssert(manager.discoverSync());
};

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
    discoveryTestHelper(this.manager, test, true);
  },
  discoverSync(test) {
    discoveryTestHelper(this.manager, test, false);
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
    test.expect(2);
    const registered = this.manager.register({
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
    test.deepEqual([...this.manager.registeredDescriptors], [{
      id: 'lorem',
      dependencies: [],
      _pluginPath: './test/test_plugins',
      name: 'Lorem',
      loader: 'loader.js',
    }]);
    test.done();
  },
  instantiate(test) {
    test.expect(3);
    Promise.all([
      this.manager.instantiate('avocado', { colorType: 'hex' }),
      this.manager.instantiate('avocado', { colorType: 'name' }),
    ])
      .then((fruits) => {
        test.deepEqual(fruits[0], {
          exports: { sugarLevel: 'low', color: '#33AA33', size: 'medium' },
          descriptor:
            {
              id: 'avocado',
              loader: 'customLoader.js',
              dependencies: ['mango', 'fruit'],
              _pluginPath: './test/test_plugins/avocado',
              name: 'Avocado',
              description: 'The main ingredient for guacamole.',
              type: 'fruit',
              sugarLevel: 'low',
            },
        });
        test.equal(fruits[1].exports.color, 'green');
        return this.manager.instantiate('avocado', { colorType: 'name' });
      })
      .then((cached) => {
        test.equal(cached.exports.color, 'green');
        test.done();
      });
  },
  require(test) {
    test.expect(3);
    const fruits = [
      this.manager.require('avocado', { colorType: 'hex' }),
      this.manager.require('avocado', { colorType: 'name' }),
    ];
    test.deepEqual(fruits[0], {
      exports: { sugarLevel: 'low', color: '#33AA33', size: 'medium' },
      descriptor:
        {
          id: 'avocado',
          loader: 'customLoader.js',
          dependencies: ['mango', 'fruit'],
          _pluginPath: './test/test_plugins/avocado',
          name: 'Avocado',
          description: 'The main ingredient for guacamole.',
          type: 'fruit',
          sugarLevel: 'low',
        },
    });
    test.equal(fruits[1].exports.color, 'green');
    test.equal(
      this.manager.require('avocado', { colorType: 'name' }).exports.color,
      'green'
    );
    test.done();
  },
  instantiateErrorNonObject(test) {
    test.expect(1);
    const manager = new PluginManager({ discovery: { rootPath: './test' } });
    manager.instantiate('mango')
      .then(() => test.done())
      .catch((error) => {
        test.equal(error.message, 'The plugin "mango" did not return an object after loading.');
        test.done();
      });
  },
  requireErrorNonObject(test) {
    test.expect(1);
    const manager = new PluginManager({ discovery: { rootPath: './test' } });
    try {
      manager.require('mango');
    }
    catch (error) {
      test.equal(error.message, 'The plugin "mango" did not return an object after loading.');
    }
    test.done();
  },
  instantiateInexisting(test) {
    test.expect(1);
    this.manager.instantiate('fail')
      .catch((error) => {
        test.equal(
          error.message,
          'Unable to find plugin with ID: "fail". Available plugins are: avocado, fruit, invalid_loader, mango, pear, ripeAvocado'
        );
        test.done();
      });
  },
  requireInexisting(test) {
    test.expect(1);
    const manager = new PluginManager({ discovery: { rootPath: './test' } });
    try {
      manager.require('fail');
    }
    catch (error) {
      test.equal(
        error.message,
        'Unable to find plugin with ID: "fail". Available plugins are: avocado, fruit, invalid_loader, mango, pear, ripeAvocado'
      );
    }
    test.done();
  },
  instantiateNonLoader(test) {
    test.expect(1);
    this.manager.instantiate('invalid_loader')
      .catch((error) => {
        test.equal(
          error.message,
          'Unable to find or execute the plugin loader for plugin "invalid_loader" (found InvalidLoader).'
        );
        test.done();
      });
  },
  requireNonLoader(test) {
    test.expect(1);
    const manager = new PluginManager({ discovery: { rootPath: './test' } });
    try {
      manager.require('invalid_loader');
    }
    catch (error) {
      test.equal(
        error.message,
        'Unable to find or execute the plugin loader for plugin "invalid_loader" (found InvalidLoader).'
      );
    }
    test.done();
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
      dependencies: ['fail'],
    });
    test.throws(() => this.manager.check('missing_deps'), 'Error');
    test.done();
  },
  all(test) {
    test.expect(1);
    const descriptor = {
      id: 'lorem',
      dependencies: [],
      loader: 'loader.js',
      _pluginPath: 'foo',
    };
    this.manager.register(descriptor);
    test.deepEqual([...this.manager.all()], [descriptor]);
    test.done();
  },
  decorates(test) {
    test.expect(4);
    this.manager.instantiate('ripeAvocado', { colorType: 'hex' })
      .then((instance) => {
        test.equals(instance.descriptor.loader, '../avocado/customLoader.js');
        test.equals(instance.exports.color, '#33AA33');
        test.equals(instance.exports.sugarLevel, 'medium');
        test.equals(instance.descriptor.sugarLevel, 'medium');
        test.done();
      });
  },
  decoratesFail(test) {
    test.expect(1);
    test.throws(() => {
      this.manager.register({
        id: 'failing',
        dependencies: [],
        _pluginPath: 'foo',
        decorates: 'fail',
      });
    }, 'Error');
    test.done();
  },
};
