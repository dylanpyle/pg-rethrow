'use strict';

const errorCodes = require('pg-error-codes');

const errorCodeMap = {};
const ERRORS = {};

/**
 * Capitalize a word.
 * @param {String} word The word to capitalize (e.g. "foobar")
 * @returns {String} The capitalized word (e.g. "Foobar")
 */
function capitalize(word) {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

/**
 * Create a custom Error constructor that:
 *  - Inherits from the native Error
 *  - Serializes nicely when logged
 *
 * @param {String} name The name of the custom error (e.g. "MyError");
 * @returns {Function} The Error constructor. Can then be thrown, and accepts
 *   one argument (the error message).
 */
function getErrorConstructor(name) {
  const ctr = function DatabaseError(message) {
    this.name = name;
    this.message = message;

    // Pull the stack trace from a real Error instance. Adding a `name` property
    // means the logged stack traces will use the correct (overridden) name.
    // Note: This is non-standard (see MDN) and might not work everywhere.
    const realError = new Error(message);
    realError.name = name;
    this.stack = realError.stack;

    Error.call(this);
  };

  ctr.prototype = Object.create(Error.prototype);
  ctr.prototype.constructor = ctr;

  return ctr;
}

Object.keys(errorCodes).forEach((key) => {
  const value = errorCodes[key];
  const capitalizedName = value.split('_').map(capitalize).join('');

  const ctr = getErrorConstructor(capitalizedName);

  ERRORS[capitalizedName] = ctr;
  errorCodeMap[key] = ctr;
});

module.exports = function(err) {
  if (!(err instanceof Error)) {
    return err;

  } else if (err.code && errorCodeMap[err.code]) {
    const newError = new errorCodeMap[err.code](err.message);

    // Copy over properties from the original generic Error, except those that
    // we set ourselves in the constructor
    Object.assign(newError, err, {
      name: newError.name,
      message: newError.message,
      stack: newError.stack
    });

    throw newError;

  } else {
    throw err;
  }
};

module.exports.ERRORS = ERRORS;
