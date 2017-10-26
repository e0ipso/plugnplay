// @flow

import type {
  PluginManagerConfig,
  PluginManagerInterface,
  PluginDescriptor,
} from '../types/common';

const { dirname } = require('path');
const glob = require('glob');
const fs = require('fs');
const _ = require('lodash');
const pify = require('pify');
const yaml = require('js-yaml');
const PluginLoaderBase = require('./PluginLoaderBase');
const PluginLoaderFactory = require('./PluginLoaderFactory');

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
  registeredDescriptors: Array<PluginDescriptor>;
  discovered: boolean;

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
    this.registeredDescriptors = [];
    this.discovered = false;
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
  discover(): Promise<Array<PluginDescriptor>> {
    if (this.discovered) {
      return Promise.resolve(this.registeredDescriptors);
    }
    // Find all the plugin descriptors.
    const pathsPromise = new Promise((resolve, reject) => {
      // Only consider files with the patter *Normalizer.js.
      glob(this._globExpression(), (err, res: Array<string>) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(res);
      });
    });
    return pathsPromise
      // Read all the files in the matched paths.
      .then(paths => Promise.all(paths
        .map(filePath => readFile(filePath).then(content => ({
          content: content.toString(),
          filePath,
        })))))
      // Parse the YAML content and detect invalid files.
      .then((contents) => {
        const docs = contents.map((data) => {
          let doc;
          try {
            doc = yaml.safeLoad(data.content);
            // Add defaults.
            doc = Object.assign({}, {
              id: '',
              exports: '',
              dependencies: [],
              _pluginPath: dirname(data.filePath),
            }, doc);
          }
          catch (e) {
            return null;
          }
          // Exclude docs without the required keys.
          // TODO: Write a schema for the `plugnplay.yml` and validate the schema instead of manual testing.
          return _.has(doc, 'id') && _.has(doc, 'exports') ? doc : null;
        });
        return docs.filter(_.identity);
      })
      .then((descriptors) => {
        // Register the discovered descriptors.
        this.registeredDescriptors = _.uniqBy(
          this.registeredDescriptors.concat(descriptors),
          'id'
        );
        // Set the discovered flag to true.
        this.discovered = true;
        return descriptors;
      });
  }

  /**
   * @inheritDoc
   */
  instantiate(pluginId: string, options: Object = {}): Promise<Object> {
    return this.discover()
      .then((descriptors) => {
        const descriptor = descriptors
          .find(({ id }) => id === pluginId);
        if (typeof descriptor === 'undefined') {
          let msg = `Unable to find plugin with ID: "${pluginId}".`;
          msg += ` Available plugins are: ${_.map(descriptors, 'id').join(', ')}`;
          throw new Error(msg);
        }
        const loader = PluginLoaderFactory.create(descriptor, this, pluginId);
        if (loader instanceof PluginLoaderBase) {
          // Get the object with the actual functionality.
          return loader.export(options);
        }
        throw new Error(`Unable to find or execute the plugin loader for plugin "${pluginId}".`);
      })
      .then((exported) => {
        if (!(exported instanceof Object)) {
          throw new Error(`The plugin "${pluginId}" did not return an object after loading.`);
        }
        return exported;
      });
  }

  /**
   * @inheritDoc
   */
  register(descriptor: PluginDescriptor): boolean {
    if (this.registeredDescriptors.find(({ id }) => id === descriptor.id)) {
      return false;
    }
    this.registeredDescriptors.push(descriptor);
    return true;
  }

  /**
   * @inheritDoc
   */
  get(pluginId: string): ?PluginDescriptor {
    return this.registeredDescriptors.find(({ id }) => id === pluginId);
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
      }
      catch (e) {
        throw new Error(`Check failed. Missing dependency "${depId}" for plugin "${pluginId}".`);
      }
    });
  }
}

module.exports = PluginManager;
