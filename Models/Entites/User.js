const otpGenerator = require('otp-generator');

class User {
  constructor(username, name, email, password, birthDate) {
    this.username = username;
    this.name = name;
    this.email = email;
    this.password = password;
    this.birthDate = birthDate;
    this.isConfirmed = false;
    this.imageUrl = undefined;
    this.bio = undefined;
    this.location = undefined;
    this.website = undefined;
    this.otp = undefined;
    this.resetToken = undefined;
    this.otpExpires = undefined;
    this.resetTokenExpires = undefined;
    this.userId = undefined;
  }

  createOTP() {
    const otp = otpGenerator.generate(8, {
      upperCaseAlphabets: false,
      specialChars: false,
    });

    this.otp = otp;
    this.otpExpires = Date.now() + 10 * 60 * 1000;

    return otp;
  }
}
module.exports = User;
