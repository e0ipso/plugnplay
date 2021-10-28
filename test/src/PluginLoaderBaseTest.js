const sinon = require('sinon');
const PluginLoaderBase = require('../../lib/PluginLoaderBase');
const PluginManager = require('../../lib/PluginManager');

module.exports = {
  setUp(cb) {
    const manager = new PluginManager();
    manager.register({
      id: 'lorem',
      loader: 'fake.js',
      _pluginPath: 'fake',
    });
    manager.check = sinon.spy();
    this.stubs.push(manager.check);
    this.loader = new PluginLoaderBase(manager, 'lorem');
    cb();
  },
  export(test) {
    test.expect(1);
    test.throws(() => this.loader.export(), 'Error');
    test.done();
  },
  constructor(test) {
    test.expect(4);
    test.ok(this.loader.manager.check.calledOnce);
    test.equal(this.loader.manager.constructor.name, 'PluginManager');
    test.equal(this.loader.descriptor.id, 'lorem');
    test.throws(
      () => new PluginLoaderBase(new PluginManager(), 'fail'),
      'Error',
    );
    test.done();
  },
};
