const express = require('express')
const router = express.Router()
const nodemailer = require('nodemailer');
require('dotenv').config();

router.post('/calculate-disability', (req, res) => {
  let { ratings, spouse, childrenUnder18, childrenOver18, numParents } = req.body

  console.log('Received request with:', {
    ratings,
    spouse,
    childrenUnder18,
    childrenOver18,
    numParents
  })

  // Validate ratings input
  if (
    !Array.isArray(ratings) ||
    ratings.length === 0 ||
    ratings.some(r => typeof r !== 'number' || r < 0 || r > 100)
  ) {
    return res.json({
      error: 'Invalid or missing ratings input. Ratings should be an array of numbers between 0 and 100.'
    })
  }

  // Default values
  spouse = !!spouse
  childrenUnder18 = childrenUnder18 || 0
  childrenOver18 = childrenOver18 || 0
  numParents = numParents || 0

  // Sort ratings in descending order and calculate exact rating
  ratings.sort((a, b) => b - a)
  console.log('Sorted ratings:', ratings)

  let exactRating = 0
  let remainingEfficiency = 100

  for (const rating of ratings) {
    const decrement = (rating / 100) * remainingEfficiency
    exactRating += decrement
    remainingEfficiency -= decrement
  }

  exactRating = Math.ceil(exactRating)
  console.log('Exact Rating after calculation:', exactRating)

  // VA rounding logic
  let roundedRating = exactRating % 10 >= 5
    ? Math.ceil(exactRating / 10) * 10
    : Math.floor(exactRating / 10) * 10

  console.log('Rounded Rating:', roundedRating)

  // VA Compensation Tables (2025)
  const basePay = {
    10: 175.51,
    20: 346.95,
    30: 537.42,
    40: 774.16,
    50: 1102.04,
    60: 1395.93,
    70: 1759.19,
    80: 2044.89,
    90: 2297.96,
    100: 3831.3
  }

  const compensationWithSpouse = {
    30: 601.42,
    40: 859.16,
    50: 1208.04,
    60: 1523.93,
    70: 1908.19,
    80: 2214.89,
    90: 2489.96,
    100: 4044.91
  }

  const compensationWithChildAndSpouse = {
    30: 648.42,
    40: 922.16,
    50: 1287.04,
    60: 1617.93,
    70: 2018.19,
    80: 2340.89,
    90: 2630.96,
    100: 4201.35
  }

  const compensationWithChildOnly = {
    30: 579.42,
    40: 831.16,
    50: 1173.04,
    60: 1480.93,
    70: 1858.19,
    80: 2158.89,
    90: 2425.96,
    100: 3974.15
  }

  const childUnder18Pay = {
    30: 31,
    40: 42,
    50: 53,
    60: 63,
    70: 74,
    80: 84,
    90: 95,
    100: 106.14
  }

  const childOver18Pay = {
    30: 102,
    40: 137,
    50: 171,
    60: 205,
    70: 239,
    80: 274,
    90: 308,
    100: 342.85
  }

  const OneParent = {
    30: 51,
    40: 68,
    50: 85,
    60: 102,
    70: 120,
    80: 137,
    90: 154,
    100: 171.44
  }

  const TwoParents = {
    30: 102,
    40: 136,
    50: 170,
    60: 204,
    70: 240,
    80: 274,
    90: 308,
    100: 342.88
  }

  function calculateVACompensation(rating, spouse, childrenUnder18, childrenOver18, numParents) {
    let baseCompensation = 0

    console.log(
      `Calculating for rating: ${rating}, spouse: ${spouse}, childrenUnder18: ${childrenUnder18}, childrenOver18: ${childrenOver18}, numParents: ${numParents}`
    )

    if (rating === 10 || rating === 20) {
      return basePay[rating] || 0
    }

    if (!spouse && childrenUnder18 === 0 && childrenOver18 === 0) {
      baseCompensation = basePay[rating] || 0
    } else if (spouse && childrenUnder18 === 0 && childrenOver18 === 0) {
      baseCompensation = compensationWithSpouse[rating] || 0
    } else if (spouse && (childrenUnder18 > 0 || childrenOver18 > 0)) {
      baseCompensation = compensationWithChildAndSpouse[rating] || 0
    } else if (!spouse && (childrenUnder18 > 0 || childrenOver18 > 0)) {
      baseCompensation = compensationWithChildOnly[rating] || 0
    }

    if (numParents === 1) {
      baseCompensation += OneParent[rating] || 0
    } else if (numParents === 2) {
      baseCompensation += TwoParents[rating] || 0
    }

    const additionalChildrenUnder18 = Math.max(0, childrenUnder18 - 1)
    baseCompensation += childUnder18Pay[rating] * additionalChildrenUnder18

    if (childrenUnder18 > 0) {
      baseCompensation += childOver18Pay[rating] * childrenOver18
    } else {
      baseCompensation += childOver18Pay[rating] * Math.max(0, childrenOver18 - 1)
    }
    
    console.log(`Final compensation: $${baseCompensation.toFixed(2)}`)
    return parseFloat(baseCompensation.toFixed(2))
  }

  let totalCompensation = calculateVACompensation(
    roundedRating,
    spouse,
    childrenUnder18,
    childrenOver18,
    numParents
  )

  console.log(`Total Compensation: $${totalCompensation.toFixed(2)}`)

  res.json({
    exactRating: exactRating.toFixed(2),
    roundedRating,
    totalCompensation: totalCompensation.toFixed(2)
  })
})

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Optional check
transporter.verify((error, success) => {
  if (error) {
    console.error('SMTP connection error:', error);
  } else {
    console.log('SMTP server ready');
  }
});

router.post('/contact', async (req, res) => {
  try {
    const { name, email, message, phone } = req.body;

    // if (!name || !email || !message) {
    //   return res.render('index', {
    //     csrfToken: req.csrfToken(),
    //     nonce: res.locals.nonce,
    //     message: 'All fields are required.'
    //   });
    // }
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
      `,
    };

    await transporter.sendMail(mailOptions);

//     return res.render('index', {
//       csrfToken: req.csrfToken(),
//       nonce: res.locals.nonce,
//       message: 'Your message was sent. Someone will contact you shortly.'
//     });
//   } catch (err) {
//     console.error('Error in contact form:', err);
//     return res.status(500).render('index', {
//       csrfToken: req.csrfToken(),
//       nonce: res.locals.nonce,
//       message: 'Internal Server Error: ' + err.message
//     });
//   }
// });

    req.flash('success', 'Your message was sent. Someone will contact you shortly.');
    return res.redirect('/');
  } catch (err) {
    console.error('Error in contact form:', err);
    req.flash('error', 'Internal Server Error: ' + err.message);
    return res.redirect('/');
  }
});


module.exports = router
