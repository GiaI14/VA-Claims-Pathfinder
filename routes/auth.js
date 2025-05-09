const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const mysql = require('mysql2/promise');
const nodemailer = require('nodemailer');


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
    service: 'smtp.sendgrid.net',
    port: 587,
    auth: {
        user: 'apikey',
        pass: process.env.SENDGRID_API_KEY
    },
    logger: true,
    debug: true,
});


router.get('/forgot-password', (req, res) => {
    res.render('forgot-password', {
        csrfToken: req.csrfToken(),
        errorMessage: null,
        successMessage: null
    });
});
////////////////////////////////////////////////////////////////////////////////////
router.get('/reset-password', async (req, res) => {
    const token = req.query.token;
    if (!token) {
        return res.render('reset-password', {
            csrfToken: req.csrfToken(),
            errorMessage: 'Missing or invalid token'
        });
    }

    // Check if token is valid and not expired
    const [users] = await pool.query(
        'SELECT * FROM users WHERE resetToken = ? AND resetTokenExpiration > NOW()',
        [token]
    );
    const user = users[0];

    if (!user) {
        return res.render('reset-password', {
            csrfToken: req.csrfToken(),
            errorMessage: 'Invalid or expired token'
        });
    }

    // Render the reset-password form, pass the token to the view
    res.render('reset-password', {
        csrfToken: req.csrfToken(),
        errorMessage: null,
        token 
    });
});

/////////////////////////////////////////////////////////////////////////////////////
router.post('/forgot-password', async (req, res) => {
    try {
        // Google users
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

        // Regular users
        const [users] = await pool.query(
            'SELECT * FROM users WHERE email = ?',
            [req.body.email]
        );
        const user = users[0];

        // Show generic success message regardless of user existence
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

        // Need to change to my domain upon completion.
        const resetLink = `${req.protocol}://${req.get('host')}/auth/reset-password?token=${token}`;
        console.log('Reset link:', resetLink);

        const mailOptions = {
            from: `"VA Claims Pathfinder" <${process.env.EMAIL_USER}>`,
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

        // Send email with token
        transporter.sendMail(mailOptions, async (error) => {
            if (error) {
                console.error('Email failed:', error);
                await pool.query(
                    'UPDATE users SET resetToken = NULL, resetTokenExpiration = NULL WHERE email = ?',
                    [user.email]
                );

                return res.render('forgot-password', {
                    csrfToken: req.csrfToken(),
                    errorMessage: 'Failed to send email',
                    successMessage: null
                });
            }

            res.render('forgot-password', {
                csrfToken: req.csrfToken(),
                successMessage: 'Reset link sent if account exists',
                errorMessage: null
            });
        });

    } catch (error) {
        console.error('System error:', error);
        res.render('forgot-password', {
            csrfToken: req.csrfToken(),
            errorMessage: 'System error - please try again',
            successMessage: null
        });
    }
});
/////////////////////////////////////////////////////////////////////////////////////
router.post('/reset-password', async (req, res) => {
    try {
        const { token, password } = req.body;

        // Valid token
        const [users] = await pool.query(
            'SELECT * FROM users WHERE resetToken = ? AND resetTokenExpiration > NOW()',
            [token]
        );
        const user = users[0];

        if (!user) throw new Error('Invalid token');

        //Update password and clear token
        const hashedPassword = await bcrypt.hash(password, 12);
        await pool.query(
            'UPDATE users SET password = ?, resetToken = NULL, resetTokenExpiration = NULL WHERE id = ?',
            [hashedPassword, user.id]
        );

        res.redirect('/login?resetSuccess=true');
    } catch (error) {
        res.render('reset-password', {
            csrfToken: req.csrfToken(),
            errorMessage: 'Invalid or expired token'
        });
    }
});

module.exports = router;
