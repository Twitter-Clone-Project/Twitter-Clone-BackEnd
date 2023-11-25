/**
 * Password.js
 *
 * This module exports a class named Password that encapsulates methods for
 * hashing and comparing passwords using the bcrypt library. The class is
 * designed to be used for handling password-related functionality in the
 * application, such as securely storing and verifying user passwords.
 *
 * @class
 */
const bcrypt = require('bcrypt');

class Password {
  /**
   * Hashes a given password using bcrypt.
   * @static
   * @async
   * @param {string} password - The password to be hashed.
   * @returns {Promise<string>} - A promise that resolves to the hashed password.
   */
  static async hashPassword(password) {
    return await bcrypt.hash(password, 10);
  }

  /**
   * Compares a plain password with a hashed password using bcrypt.
   * @static
   * @async
   * @param {string} plainPassword - The plain (unhashed) password.
   * @param {string} hashedPassword - The hashed password to compare against.
   * @returns {Promise<boolean>} - A promise that resolves to a boolean indicating
   * whether the passwords match.
   */
  static async comparePassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }
}

module.exports = Password;
