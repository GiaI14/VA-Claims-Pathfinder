const express = require('express');
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
const path = require('path');
const cookieParser = require('cookie-parser');
const csrf = require('csurf');
const csrfProtection = csrf(); //test
const bodyParser = require('body-parser');
const fs = require('fs');
const https = require('https'); // Use https for HTTPS server
const crypto = require('crypto');
const dotenv = require('dotenv');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const calculatorRoutes = require('./routes/calculatorRoutes');
const { connectToDatabase, getDb } = require('./data/database');
const registrationRoutes = require('./routes/registration');
const symptomRoutes = require('./routes/symptomRoutes');
const secondaryConditionRoutes = require('./routes/secondaryConditionRoutes');
const authRoutes = require('./routes/auth');
const contactRoutes = require('./routes/contact');

dotenv.config();

const app = express();
const port = 3000;

const googleClientId = process.env.GOOGLE_CLIENT_ID;
console.log(googleClientId);

const sessionStore = new MySQLStore({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  // collection: process.env.SESSION_COLLECTION, // Remove if not using MongoDB
});

app.use(cookieParser());

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: sessionStore,
  cookie: { 
    httpOnly: true, 
    sameSite: 'lax',
    secure: true, // Set to true if using HTTPS
  }
}));

// Generate nonce for each request
app.use((req, res, next) => {
  res.locals.nonce = crypto.randomBytes(16).toString('base64');
  next();
});

// Middleware to parse JSON bodies
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// CSRF protection
app.use((req, res, next) => {
  if (req.path === '/auth/google/callback') {
    return next(); 
  }
  csrfProtection(req, res, next);
});

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'images')));

// Helmet CSP middleware with dynamic nonce
app.use((req, res, next) => {
  const nonce = res.locals.nonce;
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'",
        `'nonce-${nonce}'`,
        "https://accounts.google.com",
        "https://apis.google.com"
      ],
      styleSrc: [
        "'self'",
        "'unsafe-inline'",
        "https://accounts.google.com"
      ],
      frameSrc: [
        "'self'",
        "https://accounts.google.com"
      ],
      connectSrc: [
        "'self'",
        "https://accounts.google.com",
        "https://play.google.com"
      ],
    },
  })(req, res, next);
});

// Debugging middleware
app.use((req, res, next) => {
  console.log('Generated Nonce:', res.locals.nonce);
  console.log("Incoming X-CSRF-Token:", req.headers['x-csrf-token']);
  console.log("Session cookie:", req.headers.cookie);
  next();
});

// Rate limiter
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Too many requests, please try again later.",
  skip: (req) => req.ip === "127.0.0.1",
});
app.use(limiter);

// Honeypot trap middleware
app.use((req, res, next) => {
  if (req.body.honeypot) {
    return res.status(400).send("Bot detected");
  }
  next();
});

// Middleware to pass CSRF token to all views
app.use((req, res, next) => {
    res.locals.csrfToken = req.csrfToken();
    next();
});

// Auth status and user loader
app.use(async function (req, res, next) {
  res.locals.isAuth = req.session.isAuthenticated || false;
  if (req.session.isAuthenticated) {
    try {
      const db = getDb();
      const [results] = await db.execute('SELECT * FROM users WHERE id = ?', [req.session.user.id]);
      if (results.length > 0) {
        res.locals.user = results[0];
        req.user = results[0];
        console.log('User:', res.locals.user);
      } else {
        req.session.isAuthenticated = false;
        console.log('User not found:', req.session.user.id);
      }
    } catch (err) {
      console.error('Error fetching user:', err);
      req.session.isAuthenticated = false;
    }
  }
  console.log('Middleware - isAuth:', res.locals.isAuth);
  next();
});

// CSRF error handler
app.use((err, req, res, next) => {
  if (err.code === 'EBADCSRFTOKEN') {
    console.error("CSRF Token Error on route:", req.originalUrl);
    return res.status(403).send('Form tampered with');
  }
  next(err);
});

// Set view engine to EJS
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Register routes
app.use('/api', calculatorRoutes);
app.use(registrationRoutes);
app.use('/', symptomRoutes);
app.use('/api', secondaryConditionRoutes);
app.use('/auth', authRoutes);
app.use('/contact', contactRoutes);

// Main routes
app.get('/', (req, res) => {
  try {
    console.log('Root route - isAuth:', res.locals.isAuth);
    console.log('CSRF Token:', res.locals.csrfToken);
    console.log('Message query:', req.query.message);
    res.render('index', {
      csrfToken: req.csrfToken(),
      nonce: res.locals.nonce,
      message: req.query.message || null
    });
  } catch (err) {
    console.error('Error in GET / route:', err);
    res.status(500).send('An error occurred on the server.');
  }
});

app.get('/secondary', (req, res) => {
  console.log('Rendering secondary with CSRF token:', req.csrfToken());
  res.render('secondary', { 
    csrfToken: req.csrfToken(),
    nonce: res.locals.nonce
  });
});

app.post('/submit-disabilities', (req, res) => {
  const disabilities = req.body.disabilities;
  if (disabilities && disabilities.length > 0) {
    console.log('Disabilities received:', disabilities);
    res.json({ message: 'Disabilities data successfully received.' });
  } else {
    res.status(400).json({ message: 'No disabilities data provided.' });
  }
});

app.get("/possibleDisabilities", async (req, res) => {
  try {
    const db = getDb();
    const [systems] = await db.execute('SELECT DISTINCT systems FROM va_disabilities');
    console.log('Systems:', systems);
    res.render("possibleDisabilities", { 
      title: "Symptom Analysis",
      csrfToken: req.csrfToken(),
      nonce: res.locals.nonce,
      systems: systems.map(row => row.systems)
    });
  } catch (err) {
    console.error('Error fetching systems:', err);
    res.status(500).send('Error fetching systems');
  }
});

// Error handler (last middleware)
app.use((err, req, res, next) => {
  console.error('Express error:', err);
  res.status(500).send('An error occurred on the server');
});

// Start server after DB connection
async function startServer() {
  try {
    await connectToDatabase();
    console.log('Database connection established');
    // Test DB connection
    const db = getDb();
    const [testResult] = await db.execute('SELECT 1 as test');
    console.log('Database test query result:', testResult);

    // HTTPS credentials
    const privateKey = fs.readFileSync('server.key', 'utf8');
    const certificate = fs.readFileSync('server.cert', 'utf8');
    const credentials = { key: privateKey, cert: certificate };

    // Start HTTPS server
    https.createServer(credentials, app).listen(port, '0.0.0.0', () => {
      console.log(`HTTPS Server running at https://67.205.168.90:${port}/`);
    });

    app.on('error', (error) => {
      console.error('Server startup error:', error);
      process.exit(1);
    });

  } catch (err) {
    console.error('Error during server startup:', err);
    process.exit(1);
  }
}

// Start the server
startServer().catch((err) => {
  console.error('Unhandled error during server startup:', err);
  process.exit(1);
});

