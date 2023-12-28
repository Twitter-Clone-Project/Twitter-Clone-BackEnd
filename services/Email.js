/**
 * Email.js
 *
 * This module exports a class named Email that is responsible for sending
 * emails using the nodemailer library. It includes methods for creating a
 * new transport, rendering email templates using Pug, and sending emails.
 * The class is designed to be used for various email functionalities in the
 * application, such as sending confirmation emails.
 *
 * @class
 * @param {Object} user - The user object with details like name and email.
 * @param {Object} data - Additional data to be used in the email template.
 */

const nodemailer = require('nodemailer');
const htmlToText = require('html-to-text');
const pug = require('pug');

module.exports = class Email {
  /**
   * Creates an instance of the Email class.
   * @constructor
   * @param {Object} user - The user object with details like name and email.
   * @param {Object} data - Additional data to be used in the email template.
   */
  constructor(user, data = {}) {
    this.firstName = user.name.split(' ')[0];
    this.to = user.email;
    this.from = `Elon Mask <${process.env.MAIL_FROM}>`;
    this.data = data;
  }

  /**
   * Creates a new nodemailer transport based on the environment.
   * @returns {Object} - The nodemailer transport object.
   */
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

  /**
   * Sends an email using the specified template and subject.
   * @param {string} template - The name of the Pug template file.
   * @param {string} subject - The subject of the email.
   * @returns {Promise} - A promise that resolves when the email is sent.
   */
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

  /**
   * Sends a confirmation email to the user.
   * @returns {Promise} - A promise that resolves when the email is sent.
   */
  async sendConfirmationEmail() {
    await this.sendEmail('confirmEmail', 'Confirm your email on X');
  }
  async sendConfirmationUpdateEmail() {
    await this.sendEmail('updateEmail', 'Confirm your email on X');
  }
};
