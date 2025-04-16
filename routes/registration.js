const express = require('express');
const bcrypt = require('bcryptjs');
const { getDb } = require('../data/database');

const router = express.Router();

router.get('/', function (req, res) {
  const loggedOut = req.query.loggedOut === 'true';
  res.render('index', { loggedOut: loggedOut });
});

router.get('/signup', function (req, res) {
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
  res.render('login', { csrfToken: req.csrfToken(), errorMessage: null, email: '' });
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
        email: enteredEmail
      });
    }

    const existingUser = existingUsers[0];
    const passwordsMatched = await bcrypt.compare(enteredPassword, existingUser.password);
    
    if (!passwordsMatched) {
      console.log('Password incorrect');
      return res.render('login', {
        errorMessage: "Could not log you in - please check your credentials!",
        email: enteredEmail
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
      email: enteredEmail
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



module.exports = router;
