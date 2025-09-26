const express = require("express");
const router = express.Router();
const rateLimit = require("express-rate-limit");

// Strict limiter just for contact form
const contactFormLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 3,              // 3 submissions per minute per IP
  message: "Too many contact form submissions. Please try again later."
});

// POST /contact
router.post("/", contactFormLimiter, async (req, res) => {
  try {
    const { name, email, message, phone, honeypot } = req.body;

    // Honeypot trap
    if (honeypot) {
      console.warn("🚨 Bot detected (honeypot filled)", req.ip);
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
    req.flash("success", "Your message was sent. Someone will contact you shortly.");
    return res.redirect("/");
  } catch (err) {
    console.error("Error in contact form:", err);
    req.flash("error", "Internal Server Error: " + err.message);
    return res.redirect("/");
  }
});

module.exports = router;
