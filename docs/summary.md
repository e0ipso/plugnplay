## Summary
_Plug'n'Play_ is a simple plugin system that will allow you leverage polymorphism.

**Example:** Imagine a service that needs to process some data and store it in S3. The piece that stores the data
could be a plugin, and you could have a plugin that writes to S3, another that writes to the local
filesystem and another that dumps the data in the console. This way you could use configuration
files to say:

> OK, run the application locally but don't upload to S3 save to my disk so I can debug
and inspect the end result.

You would only need to change `storePlugin` from `'s3'` to `'disk'`.    

### Setup
Install the module as usual with either:
  * Yarn: `yarn add plugnplay`
  * NPM: `npm install --save plugnplay`
