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
    this.passwordResetToken = undefined;
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

  createPasswordResetToken() {
    const resetToken = crypto.randomBytes(32).toString('hex');

    const hashedResetToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    this.setPasswordResetToken(hashedResetToken);

    const currentTime = new Date();
    currentTime.setMinutes(currentTime.getMinutes() + 10);
    this.setPasswordResetTokenExpires(currentTime);

    return resetToken;
  }

  setUsername(value) {
    this.username = value;
  }

  setName(value) {
    this.name = value;
  }

  setEmail(value) {
    this.email = value;
  }

  setPassword(value) {
    this.password = value;
  }

  setBirthDate(value) {
    this.birthDate = value;
  }

  setIsConfirmed(value) {
    this.isConfirmed = value;
  }

  setImageUrl(value) {
    this.imageUrl = value;
  }

  setBio(value) {
    this.bio = value;
  }

  setLocation(value) {
    this.location = value;
  }

  setWebsite(value) {
    this.website = value;
  }

  setOtp(value) {
    this.otp = value;
  }

  setPasswordResetToken(value) {
    this.passwordResetToken = value;
  }

  setOtpExpires(value) {
    this.otpExpires = value;
  }

  setPasswordResetTokenExpires(value) {
    this.passwordResetTokenExpires = value;
  }

  setUserId(value) {
    this.userId = value;
  }
}
module.exports = User;
