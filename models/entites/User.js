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
    this.otpExpires = undefined;
    this.userId = undefined;
    this.followersCount = undefined;
    this.followingsCount = undefined;
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

  setPasswordResetCode(value) {
    this.passwordResetCode = value;
  }

  setOtpExpires(value) {
    this.otpExpires = value;
  }

  setPasswordResetCodeExpires(value) {
    this.passwordResetCodeExpires = value;
  }

  setUserId(value) {
    this.userId = value;
  }

  getOtp() {
    return this.otp;
  }
}
module.exports = User;
