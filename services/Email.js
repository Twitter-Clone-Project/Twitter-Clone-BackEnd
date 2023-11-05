const nodemailer = require('nodemailer');
const htmlToText = require('html-to-text');
const pug = require('pug');

module.exports = class Email {
  constructor(user, data = {}) {
    this.firstName = user.name.split(' ')[0];
    this.to = user.email;
    this.from = `Elon Mask <${process.env.MAIL_FROM}>`;
    this.data = data;
  }

  newTransport() {
    if (process.env.NODE_ENV === 'production') {
      return nodemailer.createTransport({
        host: process.env.SENDINBLUE_SERVER,
        secure: true,
        port: process.env.SENDINBLUE_PORT,
        auth: {
          user: process.env.SENDINBLUE_USER,
          pass: process.env.SENDINBLUE_PASSWORD,
        },
      });
    }

    return nodemailer.createTransport({
      host: process.env.MAIL_HOST,
      port: process.env.MAIL_PORT,
      auth: {
        user: process.env.MAIL_USERNAME,
        pass: process.env.MAIL_PASSWORD,
      },
    });
  }

  async sendEmail(template, subject) {
    const html = pug.renderFile(
      `${__dirname}/../views/emails/${template}.pug`,
      {
        firstName: this.firstName,
        subject,
        data: this.data,
      },
    );

    const mailOptions = {
      from: this.from,
      to: this.to,
      subject,
      html,
      text: htmlToText.convert(html),
    };

    await this.newTransport().sendMail(mailOptions);
  }

  async sendConfirmationEmail() {
    await this.sendEmail('confirmEmail', 'Confirm your email on X');
  }

  async sendResetPasswordEmail() {
    await this.sendEmail(
      'resetPassword',
      'Your password reset token (valid for only 10 minutes)',
    );
  }
};
