## Summary
_Plug'n'Play_ is a simple plugin system that will allow you leverage polymorphism.

**Example 1:** Imagine a service that needs to process some data and store it in S3. The piece that stores the data
could be a plugin, and you could have a plugin that writes to S3, another that writes to the local
filesystem and another that dumps the data in the console. This way you could use configuration
files to say:

> OK, run the application locally but don't upload to S3 save to my disk so I can debug
and inspect the end result.

You would only need to change `storePlugin` from `'s3'` to `'disk'`.

**Example 2:** Your application deals with user objects, but a user can be initialized from their
public GitHub data, AboutMe, etc. You can declare a plugin type 'user' and then have plugins for
'user-from-github', 'user-from-aboutme', etc.
[More on this example](https://github.com/e0ipso/plugnplay#why-does-export-return-a-promise).

**Example 3:** In a data pipeline application you want to apply an unknown number of transformations
to your data. Similar to a middleware you want to chain _data processors_. A data processor exposes
a function that applies to your specific data and provides a specific output. Each data processor
will be a plugin instance. For instance you may want to chain 'validate-against-schema',
'remove-mb-characters', 'log-to-splunk'. Data processors can be defined in your application or can
be discovered in 3rd party modules.
