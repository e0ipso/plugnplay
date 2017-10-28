module.exports = class InvalidLoader {
  /**
   * @inheritDoc
   */
  fail(options) {
    return 'FAILS!';
  }
};
