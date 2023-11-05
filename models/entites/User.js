const otpGenerator = require('otp-generator');
const crypto = require('crypto');

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

    const hashedOTP = crypto.createHash('sha256').update(otp).digest('hex');
    this.otp = hashedOTP;

    const currentTime = new Date();
    currentTime.setMinutes(currentTime.getMinutes() + 10);
    this.otpExpires = currentTime;

    return otp;
  }
}
module.exports = User;
