const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const mysql = require('mysql2/promise');
const nodemailer = require('nodemailer');
require('dotenv').config();

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

transporter.verify(function(error, success) {
    if (error) {
        console.error('SMTP connection error:', error);
    } else {
        console.log('SMTP server is ready to take messages');
    }
});

router.get('/forgot-password', (req, res) => {
    res.render('forgot-password', {
        csrfToken: req.csrfToken(),
        errorMessage: null,
        successMessage: null
    });
});

function isStrongPassword(password) {
    return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/.test(password);
}

router.get('/reset-password', async (req, res) => {
    const token = req.query.token;
    if (!token) {
        return res.render('reset-password', {
            csrfToken: req.csrfToken(),
            errorMessage: 'Missing or invalid token',
            successMessage: null 
        });
    }
   try {
    const [users] = await pool.query(
        'SELECT * FROM users WHERE resetToken = ? AND resetTokenExpiration > NOW()',
        [token]
    );
    const user = users[0];

    if (!user) {
        return res.render('reset-password', {
            csrfToken: req.csrfToken(),
            errorMessage: 'Invalid or expired token',
            successMessage: null
        });
    }

    res.render('reset-password', {
        csrfToken: req.csrfToken(),
        errorMessage: null,
        successMessage: null,
        token 
    });
}catch (error) {
       console.error(error);
       res.render('reset-password', {
           csrfToken: req.csrfToken(),
           errorMessage: 'Server error',
           successMessage: null
       });
   }
}); 

router.post('/forgot-password', async (req, res) => {
    try {
        const [googleUsers] = await pool.query(
            'SELECT 1 FROM google_users WHERE email = ?',
            [req.body.email]
        );

        if (googleUsers.length > 0) {
            return res.render('forgot-password', {
                csrfToken: req.csrfToken(),
                errorMessage: 'Google users must reset via Google',
                successMessage: null
            });
        }

        const [users] = await pool.query(
            'SELECT * FROM users WHERE email = ?',
            [req.body.email]
        );
        const user = users[0];

        if (!user) {
            return res.render('forgot-password', {
                csrfToken: req.csrfToken(),
                successMessage: 'If account exists, reset link sent',
                errorMessage: null
            });
        }

        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 3600000);

        await pool.query(
            'UPDATE users SET resetToken = ?, resetTokenExpiration = ? WHERE email = ?',
            [token, expiresAt, user.email]
        );

        const resetLink = `${req.protocol}://${req.get('host')}/auth/reset-password?token=${token}`;

        const mailOptions = {
            from: process.env.SMTP_FROM,
            to: user.email,
            subject: "Reset Your Password",
            text: `You requested a password reset. Click the link below to reset your password:\n\n${resetLink}\n\nIf you did not request this, ignore this email.`,
            html: `
                <p>Hello,</p>
                <p>You requested a password reset. Click the link below to set a new password:</p>
                <p><a href="${resetLink}">Reset Password</a></p>
                <p>This link is valid for 1 hour. If you didn’t request this, you can safely ignore it.</p>
                <br />
                <p>Best regards,<br>VA Claims Pathfinder</p>
            `,
        };

        await transporter.sendMail(mailOptions);

        res.render('forgot-password', {
            csrfToken: req.csrfToken(),
            successMessage: 'If an account exists, a reset link has been sent to your email.',
            errorMessage: null
        });
    } catch (error) {  // <-- This catch block was misplaced
        console.error('Email failed:', error);
        await pool.query(
            'UPDATE users SET resetToken = NULL, resetTokenExpiration = NULL WHERE email = ?',
            [req.body.email]  // Use req.body.email instead of user.email for safety
        );
        res.render('forgot-password', {
            csrfToken: req.csrfToken(),
            errorMessage: 'Failed to send email. Please try again.',
            successMessage: null
        });
    }
});

router.post('/reset-password', async (req, res) => {
    try {
        const { token, password, confirmPassword } = req.body;

        if(password != confirmPassword) {
            return res.render('reset-password', {
                csrfToken: req.csrfToken(),
                errorMessage: 'Passwords do not match.',
                successMessage: null,
                token
            });
        }
        if (!isStrongPassword(password)) {
            return res.render('reset-password', {
                csrfToken: req.csrfToken(),
                errorMessage: 'Password must be at least 8 characters and include upper and lower case letters, a number, and a special character.',
                successMessage: null,
                token
            });
        }
        
        const [users] = await pool.query(
            'SELECT * FROM users WHERE resetToken = ? AND resetTokenExpiration > NOW()',
            [token]
        );
        const user = users[0];

        if (!user) throw new Error('Invalid token');

        const hashedPassword = await bcrypt.hash(password, 12);
        await pool.query(
            'UPDATE users SET password = ?, resetToken = NULL, resetTokenExpiration = NULL WHERE id = ?',
            [hashedPassword, user.id]
        );

        res.redirect('/login?resetSuccess=true');
    } catch (error) {
        res.render('reset-password', {
            csrfToken: req.csrfToken(),
            errorMessage: 'Invalid or expired token',
            successMessage: null
        });
    }
});

module.exports =  {
    router,
    transporter
};



