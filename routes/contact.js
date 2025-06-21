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
  try {
    console.log('Incoming contact request:', req.body);

    const { name, email, message, phone } = req.body;

    if (!name || !email || !message) {
      req.session.formMessage = 'All fields are required.';
      return res.redirect('/');
    }

    const mailOptions = {
      from: process.env.SMTP_FROM,
      to: process.env.CONTACT_RECEIVER_EMAIL,
      subject: `New contact form submission from ${name}`,
      text: `Name: ${name}\nEmail: ${email}\nPhone: ${phone || 'Not provided'}\n\nMessage:\n${message}`,
    html: `
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Phone:</strong> ${phone || 'Not provided'}</p>
      <p><strong>Message:</strong></p>
      <p>${message}</p>
  `,
};

    // ✅ Actually send the email and declare info
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);


    req.session.formMessage = 'Your request was sent. Someone will contact you shortly.';
    res.redirect('/');
    
   } catch (err) {
    console.error('Error in /contact route:', err);
    req.session.formMessage = 'Internal Server Error: ' + err.message;
    res.redirect('/');
  }
});

module.exports = router;
