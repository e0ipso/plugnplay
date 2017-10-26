const sinon = require('sinon');
const PluginLoaderBase = require('../../lib/PluginLoaderBase');
const PluginManager = require('../../lib/PluginManager');

module.exports = {
  setUp(cb) {
    const manager = new PluginManager();
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
    test.expect(3);
    test.ok(this.loader.manager.check.calledOnce);
    test.equal(this.loader.manager.constructor.name, 'PluginManager');
    test.equal(this.loader.pluginId, 'lorem');
    test.done();
  },
};
