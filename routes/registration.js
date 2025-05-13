const express = require('express');
const bcrypt = require('bcryptjs');
const { getDb } = require('../data/database');
const { OAuth2Client } = require('google-auth-library');
const router = express.Router();
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;


router.get('/', function (req, res) {
  const loggedOut = req.query.loggedOut === 'true';
  res.render('index', { loggedOut: loggedOut });
});

router.get('/signup', function (req, res) {
  console.log('GET /signup route hit');
  let sessionInputData = req.session.inputData;
  if (!sessionInputData) {
    sessionInputData = {
      hasError: false,
      email: '',
      confirmEmail: '',
      password: ''
    };
  }
  req.session.inputData = null;
  res.render('signup', { inputData: sessionInputData, csrfToken: req.csrfToken() });
});

////////////////////////////////////////////////////////////////////////////////
router.post('/signup', async function (req, res) {
  console.log(req.body);

  const userData = req.body;
  const db = getDb();

  const enteredEmail = userData.email;
  //** */
  const enteredConfirmEmail = userData.confirmEmail;
  const enteredPassword = userData.password;

  if (
    !enteredEmail ||
    !enteredConfirmEmail ||
    !enteredPassword ||
    enteredPassword.trim().length < 6 ||
    enteredEmail !== enteredConfirmEmail ||
    !enteredEmail.includes('@')
  ) {
    console.log('Incorrect input, please try again');

    req.session.inputData = {
      hasError: true,
      message: "Invalid input, please check your entries and try again.",
      email: enteredEmail,
      confirmEmail: enteredConfirmEmail,
      password: enteredPassword
    };

    req.session.save(function () {
      res.redirect('/signup');
    });
    return;
  }

  try {
    const [existingUsers] = await db.execute('SELECT * FROM users WHERE email = ?', [enteredEmail]);
    console.log('Existing Users:', existingUsers);

    if (existingUsers.length > 0) {
      console.log('User already exists');
      req.session.inputData = {
        hasError: true,
        message: "User already exists. Please use a different email.",
        email: enteredEmail,
        confirmEmail: enteredConfirmEmail,
        password: enteredPassword
      };
      req.session.save(function () {
        res.redirect('/signup');
      });
      return;
    }

    const hashedPassword = await bcrypt.hash(enteredPassword, 12);
    await db.execute('INSERT INTO users (email, password) VALUES (?, ?)', [enteredEmail, hashedPassword]);

    req.session.inputData = null;
    res.redirect('/login');
  } catch (error) {
    console.error("Database error:", error);

    req.session.inputData = {
      hasError: true,
      message: "An error occurred. Please try again later.",
      email: enteredEmail,
      confirmEmail: enteredConfirmEmail,
      password: enteredPassword
    };
    req.session.save(function () {
      res.redirect('/signup');
    });
    return;
  }
});
////////////////////////////////////////////////////////////////////////////////
router.get('/login', function(req, res) {
  console.log('GET /login route hit');
  res.render('login', { 
    csrfToken: req.csrfToken(), 
    errorMessage: null, 
    email: '',
    googleClientId: process.env.GOOGLE_CLIENT_ID
   });
});

// POST route for handling login
router.post('/login', async function (req, res) {
  const db = getDb();
  const userData = req.body;
  const enteredEmail = userData.email;
  const enteredPassword = userData.password;

  try {
    const [existingUsers] = await db.execute('SELECT * FROM users WHERE email = ?', [enteredEmail]);
    console.log('Existing User:', existingUsers[0]);

    if (!existingUsers || existingUsers.length === 0) {
      console.log('User not found');
      return res.render('login', {
        errorMessage: "User does not exist. Please register!",
        email: enteredEmail,
        googleClientId: process.env.GOOGLE_CLIENT_ID
      });
    }

    const existingUser = existingUsers[0];
    const passwordsMatched = await bcrypt.compare(enteredPassword, existingUser.password);
    
    if (!passwordsMatched) {
      console.log('Password incorrect');
      return res.render('login', {
        errorMessage: "Could not log you in - please check your credentials!",
        email: enteredEmail,
        googleClientId: process.env.GOOGLE_CLIENT_ID
      });
    }

    req.session.user = { id: existingUser.id, email: existingUser.email };
    req.session.isAuthenticated = true;
    req.session.save(function (err) {
      if (err) {
        console.log(err);
        return res.redirect('/login');
      }
      res.redirect('/');
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).render('login', {
      errorMessage: "An error occurred. Please try again later.",
      email: enteredEmail,
      googleClientId: process.env.GOOGLE_CLIENT_ID
    });
  }
});
///////////////////////////////////////////////////////////////////////////////////////////
router.post('/logout', function (req, res) {
  if (req.session) {
    req.session.destroy(err => {
      if (err) {
        console.error('Logout error:', err);
        return res.status(500).send('Could not log out.');
      }
      console.log('User logged out successfully'); 
      res.clearCookie('connect.sid'); 
      return res.redirect('/?loggedOut=true');
    });
  } else {
    console.log('No active session found'); 
    return res.redirect('/?loggedOut=true');
  }
});

///////////////////////////////////////////////////////////////////////////////////////////////
router.post('/auth/google/callback', async (req, res) => {
  console.log('Request body received:', req.body);

  if (!req.body.credential) {
      console.error('Missing credential in:', req.body);
      return res.status(400).json({ error: 'Invalid request' });
  }

  try {
      const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
      const ticket = await client.verifyIdToken({
          idToken: req.body.credential,
          audience: process.env.GOOGLE_CLIENT_ID,
      });

      const payload = ticket.getPayload();
      console.log('Google payload:', {
          email: payload.email,
          // name: payload.name,
          picture: payload.picture,
          google_id: payload.sub,
      });

      const db = getDb();

      let [googleUser] = await db.execute('SELECT * FROM google_users WHERE email = ?', [payload.email]);
      googleUser = googleUser[0];

      if (!googleUser) {
          const [result] = await db.execute(
              'INSERT INTO google_users (email, google_id, avatar) VALUES (?, ?, ?)',
              [payload.email, payload.sub, payload.picture]
          );
          const [newGoogleUser] = await db.execute('SELECT * FROM google_users WHERE id = ?', [result.insertId]);
          googleUser = newGoogleUser[0];
      }

      req.session.regenerate((err) => {
          if (err) {
              console.error('Session regeneration error:', err);
              return res.redirect('/login');
          }

          req.session.user = {
              id: googleUser.id,
              email: googleUser.email,
              avatar: googleUser.avatar,
              google_id: googleUser.google_id,
          };
          req.session.isAuthenticated = true;

          req.session.save((err) => {
              if (err) {
                  console.error('Session save error:', err);
                  return res.redirect('/login');
              }

              console.log('Auth successful for:', payload.email);
              res.setHeader('Cache-Control', 'no-store');
              return res.json({success: true, redirectUrl: '/'});
          });
      });
  } catch (error) {
      console.error('Auth error:', error);
      return res.status(401).redirect('/login');
  }
});


module.exports = router;
