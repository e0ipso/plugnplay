// Uncomment this to debug step-by-step through the source scripts, not the
// compiled ones.
// require('flow-remove-types/register');
// const PluginManager = require('./src/PluginManager');
// const PluginBase = require('./src/PluginBase');

const PluginManager = require('./lib/PluginManager');
const PluginLoaderBase = require('./lib/PluginLoaderBase');
const PluginLoaderFactory = require('./lib/PluginLoaderFactory');

module.exports = {
  PluginManager,
  PluginLoaderBase,
  PluginLoaderFactory,
};
