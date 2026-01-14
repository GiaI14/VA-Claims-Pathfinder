const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
require('dotenv').config();
const rateLimit = require("express-rate-limit");

const contactFormLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 3,              // max 3 submissions per minute per IP
  message: "Too many contact form submissions. Please try again later."
});

router.post('/calculate-disability', (req, res) => {
  let { ratings, spouse, childrenUnder18, childrenOver18, numParents } = req.body;

  console.log('Received request with:', { ratings, spouse, childrenUnder18, childrenOver18, numParents });

  // Validate ratings input
  if (
    !Array.isArray(ratings) ||
    ratings.length === 0 ||
    ratings.some(r => typeof r !== 'number' || r < 0 || r > 100)
  ) {
    return res.json({
      error: 'Invalid or missing ratings input. Ratings should be an array of numbers between 0 and 100.'
    });
  }

  // Default values
  spouse = !!spouse;
  childrenUnder18 = childrenUnder18 || 0;
  childrenOver18 = childrenOver18 || 0;
  numParents = numParents || 0;

  // Sort ratings in descending order and calculate exact rating
  ratings.sort((a, b) => b - a);
  console.log('Sorted ratings:', ratings);

  let exactRating = 0;
  let remainingEfficiency = 100;

  for (const rating of ratings) {
    const decrement = (rating / 100) * remainingEfficiency;
    exactRating += decrement;
    remainingEfficiency -= decrement;
  }

  exactRating = Math.round(exactRating);
  console.log('Exact Rating after calculation:', exactRating);

  // VA rounding logic
  let roundedRating =
    exactRating % 10 >= 5
      ? Math.ceil(exactRating / 10) * 10
      : Math.floor(exactRating / 10) * 10;
  console.log('Rounded Rating:', roundedRating);

  // VA Compensation Tables (2025)
  const basePay = { 10: 180.42, 20: 356.66, 30: 552.47, 40: 795.84, 50: 1132.90, 60: 1435.02, 70: 1808.45, 80: 2102.15, 90: 2362.30, 100: 3938.58 };
  const compensationWithSpouse = { 30: 617.47, 40: 882.84, 50: 1241.90, 60: 1566.02, 70: 1961.45, 80: 2277.15, 90: 2559.30, 100: 4158.17 };
  const compensationWithChildAndSpouse = { 30: 666.47, 40: 947.84, 50: 1322.90, 60: 1663.02, 70: 2074.45, 80: 2406.15, 90: 2704.30, 100: 4318.99 };
  const compensationWithChildOnly = { 30: 596.47, 40: 853.84, 50: 1205.90, 60: 1523.02, 70: 1910.45, 80: 2219.15, 90: 2494.30, 100: 4085.43 };
  const childUnder18Pay = { 30: 32, 40: 43, 50: 54, 60: 65, 70: 76, 80: 87, 90: 98, 100: 109.11 };
  const childOver18Pay = { 30: 105, 40: 140, 50: 176, 60: 211, 70: 246, 80: 281, 90: 317, 100: 352.45 };
  const OneParent = { 30: 52, 40: 70, 50: 88, 60: 105, 70: 123, 80: 140, 90: 158, 100: 176.24 };
  const TwoParents = { 30: 104, 40: 140, 50: 176, 60: 210, 70: 246, 80: 280, 90: 316, 100: 352.48 };

  function calculateVACompensation(rating, spouse, childrenUnder18, childrenOver18, numParents) {
    let baseCompensation = 0;

    console.log(`Calculating for rating: ${rating}, spouse: ${spouse}, childrenUnder18: ${childrenUnder18}, childrenOver18: ${childrenOver18}, numParents: ${numParents}`);

    if (rating === 10 || rating === 20) {
      return basePay[rating] || 0;
    }

    if (!spouse && childrenUnder18 === 0 && childrenOver18 === 0) {
      baseCompensation = basePay[rating] || 0;
    } else if (spouse && childrenUnder18 === 0 && childrenOver18 === 0) {
      baseCompensation = compensationWithSpouse[rating] || 0;
    } else if (spouse && (childrenUnder18 > 0 || childrenOver18 > 0)) {
      baseCompensation = compensationWithChildAndSpouse[rating] || 0;
    } else if (!spouse && (childrenUnder18 > 0 || childrenOver18 > 0)) {
      baseCompensation = compensationWithChildOnly[rating] || 0;
    }

    if (numParents === 1) baseCompensation += OneParent[rating] || 0;
    else if (numParents === 2) baseCompensation += TwoParents[rating] || 0;

    const additionalChildrenUnder18 = Math.max(0, childrenUnder18 - 1);
    baseCompensation += childUnder18Pay[rating] * additionalChildrenUnder18;

    if (childrenUnder18 > 0) {
      baseCompensation += childOver18Pay[rating] * childrenOver18;
    } else {
      baseCompensation += childOver18Pay[rating] * Math.max(0, childrenOver18 - 1);
    }

    console.log(`Final compensation: $${baseCompensation.toFixed(2)}`);
    return parseFloat(baseCompensation.toFixed(2));
  }

  let totalCompensation = calculateVACompensation(roundedRating, spouse, childrenUnder18, childrenOver18, numParents);
  console.log(`Total Compensation: $${totalCompensation.toFixed(2)}`);

  res.json({
    exactRating: exactRating.toFixed(2),
    roundedRating,
    totalCompensation: totalCompensation.toFixed(2)
  });
});

// Nodemailer setup
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

// Optional check
transporter.verify((error, success) => {
  if (error) console.error('SMTP connection error:', error);
  else console.log('SMTP server ready');
});

router.post('/contact', contactFormLimiter, async (req, res) => {
  try {
    const { name, email, message, phone } = req.body;

    if (!name || !email || !message) {
      req.flash('error', 'All fields are required.');
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
      `
    };

    await transporter.sendMail(mailOptions);
    req.flash('success', 'Your message was sent. Someone will contact you shortly.');
    return res.redirect('/');
  } catch (err) {
    console.error('Error in contact form:', err);
    req.flash('error', 'Internal Server Error: ' + err.message);
    return res.redirect('/');
  }
});

module.exports = router;
