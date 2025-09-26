const express = require("express");
const router = express.Router();
const rateLimit = require("express-rate-limit");
const nodemailer = require("nodemailer");

// Strict limiter just for contact form
const contactFormLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 3,
  message: "Too many contact form submissions. Please try again later."
});

// Nodemailer transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false, // true if using 465
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

router.post("/", contactFormLimiter, async (req, res) => {
  try {
    const { name, email, message, phone, honeypot } = req.body;

    if (honeypot) {
      console.warn("Bot detected:", req.ip);
      return res.status(400).send("Bot detected");
    }

    if (!name || !email || !message) {
      req.flash("error", "All fields are required.");
      return res.redirect("/");
    }

    const mailOptions = {
      from: process.env.SMTP_FROM,
      to: process.env.CONTACT_RECEIVER_EMAIL,
      subject: `New contact form submission from ${name}`,
      text: `Name: ${name}\nEmail: ${email}\nPhone: ${phone || "Not provided"}\n\nMessage:\n${message}`,
      html: `
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone || "Not provided"}</p>
        <p><strong>Message:</strong></p>
        <p>${message}</p>
      `,
    };

    await transporter.sendMail(mailOptions);

    req.flash("successMessage", "Your message was sent. Someone will contact you shortly.");
    return res.redirect("/#contact");
  } catch (err) {
    console.error("Error in contact form:", err);
    req.flash("errorMessage", "Internal Server Error: " + err.message);
    return res.redirect("/#contact");
  }
});

module.exports = router;
