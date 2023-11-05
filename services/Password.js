const bcrypt = require('bcrypt');

class Password {
  static async hashPassword(password) {
    return await bcrypt.hash(password, 10);
  }

  static async comparePassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }
}

module.exports = Password;
