const express = require('express');
const router = express.Router();
const { transporter } = require('./auth'); 

router.get('/contact', (req, res) => {
  res.render('contact', {
    csrfToken: req.csrfToken(),
    nonce: res.locals.nonce
  });
});

router.post('/contact', async (req, res) => {
  const { name, email, phone, message } = req.body;

  const mailOptions = {
    from: email,
    to: 'vaclaimspathfinder@gmail.com',
    subject: 'New Contact Form Submission',
    text: `Name: ${name}\nEmail: ${email}\nPhone: ${phone || 'N/A'}\n\nMessage:\n${message}`
  };

  try {
    await transporter.sendMail(mailOptions);
    res.send('Message sent!');
  } catch (err) {
    console.error('Error sending email:', err);
    res.status(500).send('Failed to send message.');
  }
});

module.exports = router;
