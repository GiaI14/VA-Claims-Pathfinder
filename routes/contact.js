const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

transporter.verify(function (error, success) {
  if (error) {
    console.error('SMTP connection error:', error);
  } else {
    console.log('SMTP server ready for contact messages');
  }
});

router.post('/contact', async (req, res) => {
  const { name, email, message } = req.body;

  const mailOptions = {
    from: process.env.SMTP_FROM,
    to: process.env.CONTACT_RECIPIENT_EMAIL,
    subject: `Contact Form Submission from ${name}`,
    text: `Email: ${email}\n\nMessage:\n${message}`,
  };

  try {
    await transporter.sendMail(mailOptions);
    res.status(200).send('Message sent');
  } catch (err) {
    console.error('Failed to send contact email:', err);
    res.status(500).send('Failed to send message');
  }
});

module.exports = router;
