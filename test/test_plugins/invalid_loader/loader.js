module.exports = class InvalidLoader {
  /**
   * @inheritDoc
   */
  export(options) {
    return 'FAILS!';
  }
};
