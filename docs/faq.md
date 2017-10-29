## FAQ
### Why not just node modules that you include with a `require`?
Plugins offer several features that you can't easily obtain with `require('./some/code')`:
  * 3rd party modules can provide plugins that your app can discover for feature enhancements.
  * Typed plugins ensure expectations on what is returned.
  * Plugins can be registered at run-time.
  * Plugins can return a promise. This allows you to do _async requires_.
  * Plugins are auto-discovered and instantiated by ID. Requiring a plugin does not depend on the
  directory you are in.
### Can external modules provide plugins?
They can! Just by declaring the plugin, anyone can find that module in the filesystem. If your
application needs plugins provided by 3rd party modules, make sure to enable the `allowsContributed`
option.
### What's the impact on performance of the plugin auto discovery?
If you include plugins from 3rd party modules and your `node_modules` directory is very big, then it
may take a while to scan all the files. If that's your case reduce the scope of the scan with the
`rootPath` option.

For instance:
```js
const { PluginManager } = require('plugnplay');

const manager = new PluginManager({
  discovery: {
    allowsContributed: true,
    rootPath: '+(./lib|./node_modules/foo_*|./node_modules/bar)'
  }
});
```

See more path options in the [Glob](https://github.com/isaacs/node-glob#readme) project.

### Why does `export()` return a `Promise`?
The recommendation is that your plugin instance is fully loaded and ready to be used. That's why it
can accept configuration options. That is also the reason why `export()` returns a promise, so it
can execute async operations to fully load the exported data.

For instance:
```js
/**
 * 'user-from-github' is a plugin of type 'user'.
 * 
 * It contains the name, username, image and a google maps object about the user. It also contains a
 * connection to the database to read/write users.
 */
module.exports = UserFromGitHubLoader extends PluginLoaderBase {
  exports(options = {}) {
    const promises = [
      request(`https://api.github.com/users/${options.username}`),
      new SqlConnection('foo', 'bar')
    ];
    return Promise.all(promises)
      .then(([data, storage]) => ({
        image: data.avatar_url,
        username: options.username,
        map: new GoogleMaps(data.location),
        name: data.name,
        storage,
      }));
  }
}
```

This way your User plugin can be initialized synchronously from your apps data, or asynchronously by
using GitHub's data. You don't care where the info came from, you just use the plugin instance!
