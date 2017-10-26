// Uncomment this to debug step-by-step through the source scripts, not the
// compiled ones.
// require('flow-remove-types/register');
// const PluginManager = require('./src/PluginManager');
// const PluginBase = require('./src/PluginBase');

const PluginManager = require('./lib/PluginManager');
const PluginBase = require('./lib/PluginBase');

module.exports = {
  PluginManager,
  PluginBase,
};
