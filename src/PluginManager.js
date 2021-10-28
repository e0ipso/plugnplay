// @flow

import type {
  PluginManagerConfig,
  PluginManagerInterface,
  PluginDescriptor,
  PluginInstance,
  DescriptorFileContents,
} from '../types/common';

const _ = require('lodash');
const { stringify } = require('flatted');
const fs = require('fs');
const glob = require('glob');
const md5 = require('md5');
const path = require('path');
const PluginLoaderFactory = require('./PluginLoaderFactory');
const pify = require('pify');
const yaml = require('js-yaml');

const readFile = pify(fs.readFile);
const PLUGNPLAY_FILE = 'plugnplay.yml';

/**
 * @classdesc
 *   Discovers and instantiates plugins.
 * @class
 *   PluginManager
 */
class PluginManager implements PluginManagerInterface {
  config: PluginManagerConfig;
  registeredDescriptors: Set<PluginDescriptor>;
  discovered: boolean;
  instances: Map<string, PluginInstance>;

  /**
   * Creates a new plugin manager object.
   *
   * @param {Object} config
   *   The configuration options.
   */
  constructor(config: Object = {}) {
    const defaults: PluginManagerConfig = {
      discovery: {
        rootPath: '.',
        allowsContributed: true,
      },
    };
    this.config = _.merge(defaults, config);
    this.registeredDescriptors = new Set();
    this.discovered = false;
    this.instances = new Map();
  }

  /**
   * Builds the globbing expression based on the configuration options.
   *
   * @return {string}
   *   The globbing expression.
   *
   * @private
   */
  _globExpression(): string {
    const options = this.config.discovery;
    return options.allowsContributed
      ? `${options.rootPath}/**/${PLUGNPLAY_FILE}`
      : `${options.rootPath}/!(node_modules)/**/${PLUGNPLAY_FILE}`;
  }

  /**
   * @inheritDoc
   */
  discover(): Promise<Set<PluginDescriptor>> {
    if (this.discovered) {
      return Promise.resolve(this.registeredDescriptors);
    }
    // Find all the plugin descriptors.
    const pathsPromise = new Promise((resolve, reject) => {
      // Only consider files with the expected pattern.
      glob(this._globExpression(), (err, res: Array<string>) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(res);
      });
    });
    return (
      pathsPromise
        // Read all the files in the matched paths.
        .then((paths) =>
          Promise.all(
            paths.map((filePath) =>
              readFile(filePath).then((content) => ({
                content: content.toString(),
                filePath,
              })),
            ),
          ),
        )
        // Parse the YAML content and detect invalid files.
        .then((contents) => this._loadDescriptorsFromContents(contents))
        .then((descriptors) => this._registerDescriptors(descriptors))
    );
  }

  /**
   * @inheritDoc
   */
  discoverSync(): Set<PluginDescriptor> {
    if (this.discovered) {
      return this.registeredDescriptors;
    }
    // Find all the plugin descriptors.
    const paths = glob.sync(this._globExpression());
    const contents = paths.map((filePath: string): DescriptorFileContents => ({
      content: fs.readFileSync(filePath).toString(),
      filePath,
    }));
    const descriptors = this._loadDescriptorsFromContents(contents);
    return this._registerDescriptors(descriptors);
  }

  /**
   * Loads the descriptors from the contents of the file candidates.
   *
   * @param {DescriptorFileContents[]} contents
   *   The contents of the plugin candidates.
   *
   * @return {PluginDescriptor[]}
   *   The array of plugin descriptors.
   *
   * @private
   */
  _loadDescriptorsFromContents(
    contents: Array<DescriptorFileContents>,
  ): Array<PluginDescriptor> {
    const docs = contents.map((data) => {
      let doc;
      try {
        doc = yaml.safeLoad(data.content);
        // Add defaults.
        doc = this._addDefaults(doc, path.dirname(data.filePath));
      } catch (e) {
        return null;
      }
      return doc;
    });
    return docs.filter(_.identity);
  }

  /**
   * Register the discovered descriptors.
   *
   * @param {PluginDescriptor[]} descriptors
   *   The discovered descriptors candidates.
   *
   * @return {Set<PluginDescriptor>}
   *   A set of verified descriptors.
   *
   * @private
   */
  _registerDescriptors(
    descriptors: Array<PluginDescriptor>,
  ): Set<PluginDescriptor> {
    this.registeredDescriptors = new Set([
      ...this.registeredDescriptors,
      ...descriptors,
    ]);
    descriptors
      .filter(({ decorates }) => decorates)
      .forEach((descriptor) => this.register(descriptor));
    // Exclude docs without the required keys.
    this.registeredDescriptors.forEach((doc) => {
      if (doc.id === '' || doc.loader === '') {
        this.registeredDescriptors.delete(doc);
      }
    });
    // Set the discovered flag to true.
    this.discovered = true;
    return this.registeredDescriptors;
  }

  /**
   * Adds the missing defaults to the plugin descriptor.
   *
   * @param {Object} doc
   *   The plugin descriptor without defaults.
   * @param {string} pluginPath
   *   The plugin path.
   *
   * @return {PluginDescriptor}
   *   The descriptor.
   *
   * @private
   */
  _addDefaults(doc: Object, pluginPath: string): PluginDescriptor {
    const output = Object.assign(
      {},
      {
        id: '',
        loader: 'loader.js',
        dependencies: [],
        _pluginPath: pluginPath,
      },
      doc,
    );
    if (typeof doc.type !== 'undefined') {
      output.dependencies.push(doc.type);
    }
    output.dependencies = _.uniq(output.dependencies);
    return output;
  }

  /**
   * Pulls in data from the decorated descriptor into the current descriptor.
   *
   * @param {PluginDescriptor} descriptor
   *   The decorated descriptor.
   *
   * @returns {PluginDescriptor}
   *   The descriptor with the values from the decorated.
   *
   * @private
   */
  _decorateDescriptor(descriptor: PluginDescriptor): PluginDescriptor {
    let output = Object.assign({}, descriptor);
    if (typeof descriptor.decorates === 'undefined') {
      return output;
    }
    const decoratedId: string = descriptor.decorates;
    output.dependencies.push(decoratedId);
    const decoratedDescriptor = this.get(decoratedId);
    if (!decoratedDescriptor) {
      throw new Error('Unable to find the decorated plugin');
    }
    output = _.merge({}, decoratedDescriptor, output);
    output = this._addDefaults(output, output._pluginPath);
    // Calculate how to modify the loader path so it can be required from the
    // decorator path.
    const pathFix = path.relative(
      descriptor._pluginPath,
      decoratedDescriptor._pluginPath,
    );
    output.loader = path.join(pathFix, decoratedDescriptor.loader);
    return output;
  }

  /**
   * @inheritDoc
   */
  instantiate(pluginId: string, options: Object = {}): Promise<PluginInstance> {
    const inst = this.instances.get(this._getCid(pluginId, options));
    if (inst) {
      return Promise.resolve(inst);
    }
    return this.discover()
      .then((descriptors) => {
        const descriptor = [...descriptors].find(({ id }) => id === pluginId);
        if (typeof descriptor === 'undefined') {
          let msg = `Unable to find plugin with ID: "${pluginId}".`;
          msg += ` Available plugins are: ${_.map([...descriptors], 'id').join(
            ', ',
          )}`;
          throw new Error(msg);
        }
        const loader = PluginLoaderFactory.create(descriptor, this, pluginId);
        if (
          typeof loader._doExport === 'function' &&
          typeof loader.export === 'function' &&
          loader.constructor.prototype
        ) {
          // Get the object with the actual functionality.
          return loader
            ._doExport(options)
            .then((exports) => ({ exports, descriptor }));
        }
        let msg = `Unable to find or execute the plugin loader for plugin "${pluginId}"`;
        msg += ` (found ${loader.constructor.name}).`;
        throw new Error(msg);
      })
      .then((instance) => {
        if (!(instance.exports instanceof Object)) {
          throw new Error(
            `The plugin "${pluginId}" did not return an object after loading.`,
          );
        }
        this.instances.set(
          this._getCid(instance.descriptor.id, options),
          instance,
        );
        return instance;
      });
  }

  /**
   * @inheritDoc
   */
  require(pluginId: string, options: Object = {}): PluginInstance {
    const inst = this.instances.get(this._getCid(pluginId, options));
    if (inst) {
      return inst;
    }
    const descriptors = this.discoverSync();
    const descriptor = [...descriptors].find(({ id }) => id === pluginId);
    if (typeof descriptor === 'undefined') {
      let msg = `Unable to find plugin with ID: "${pluginId}".`;
      msg += ` Available plugins are: ${_.map([...descriptors], 'id').join(
        ', ',
      )}`;
      throw new Error(msg);
    }
    const loader = PluginLoaderFactory.create(descriptor, this, pluginId);
    if (
      typeof loader._doExportSync !== 'function' ||
      typeof loader.exportSync !== 'function' ||
      !loader.constructor.prototype
    ) {
      let msg = `Unable to find or execute the plugin loader for plugin "${pluginId}"`;
      msg += ` (found ${loader.constructor.name}).`;
      throw new Error(msg);
    }
    // Get the object with the actual functionality.
    const instance = { exports: loader._doExportSync(options), descriptor };
    if (!(instance.exports instanceof Object)) {
      throw new Error(
        `The plugin "${pluginId}" did not return an object after loading.`,
      );
    }
    this.instances.set(this._getCid(instance.descriptor.id, options), instance);
    return instance;
  }

  /**
   * @inheritDoc
   */
  register(descriptor: Object): boolean {
    const existing = [...this.registeredDescriptors].find(
      ({ id }) => id === descriptor.id,
    );
    if (existing) {
      this.registeredDescriptors.delete(existing);
    }
    if (typeof descriptor._pluginPath === 'undefined') {
      return false;
    }
    const output = this._decorateDescriptor(
      this._addDefaults(descriptor, descriptor._pluginPath),
    );
    this.registeredDescriptors.add(output);
    return true;
  }

  /**
   * @inheritDoc
   */
  get(pluginId: string): ?PluginDescriptor {
    return [...this.registeredDescriptors].find(({ id }) => id === pluginId);
  }

  /**
   * @inheritDoc
   */
  check(pluginId: string): void {
    const descriptor = this.get(pluginId);
    if (!descriptor) {
      throw new Error(`Check failed. Missing plugin "${pluginId}".`);
    }
    return descriptor.dependencies.forEach((depId) => {
      try {
        this.check(depId);
      } catch (e) {
        throw new Error(
          `Check failed. Missing dependency "${depId}" for plugin "${pluginId}".`,
        );
      }
    });
  }

  /**
   * @inheritDoc
   */
  all(): Set<PluginDescriptor> {
    return this.registeredDescriptors;
  }

  /**
   * Generates a cache ID for the plugin and the config.
   *
   * @param {string} pluginId
   *   The plugin ID.
   * @param {Object} options
   *   The options for the plugin.
   *
   * @return {string}
   *   The cache ID.
   *
   * @private
   */
  _getCid(pluginId: string, options: Object): string {
    return md5(`${pluginId}::${stringify(options)}`);
  }
}

module.exports = PluginManager;
