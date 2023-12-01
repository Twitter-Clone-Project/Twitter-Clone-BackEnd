/**
 * catchAsync.js
 *
 * This module exports a higher-order function that wraps an asynchronous
 * function and ensures any errors thrown during its execution are passed
 * to the Express `next` middleware. It simplifies error handling in
 * asynchronous routes or middleware functions.
 *
 * @param {function} fn - An asynchronous function that handles the request, response, and next middleware.
 * @returns {function} - A new function that wraps the provided asynchronous function, catching any errors and passing them to the `next` middleware.
 */

module.exports = (fn) => (req, res, next) => {
  fn(req, res, next).catch(next); //==== catch(er=>next(er))
};
