const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');

router.post('/contact', async (req, res) => {
  const { name, email, message } = req.body;

  const transporter = nodemailer.createTransport({
    service: 'Gmail', // or use SMTP settings
    auth: {
      user: 'your_email@gmail.com',
      pass: 'your_app_password' // Use app-specific password if using Gmail
    }
  });

  const mailOptions = {
    from: email,
    to: 'vaclaimspathfinder@gmail.com',
    subject: 'New Contact Form Submission',
    text: `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`
  };

  try {
    await transporter.sendMail(mailOptions);
    res.send('Thank you for your message!');
  } catch (err) {
    console.error('Email sending failed:', err);
    res.status(500).send('Error sending message.');
  }
});

module.exports = router;
