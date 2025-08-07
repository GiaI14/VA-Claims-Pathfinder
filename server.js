const express = require('express');
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
const path = require('path');
const cookieParser = require('cookie-parser');
const csrf = require('csurf');
const bodyParser = require('body-parser');
const fs = require('fs');
const https = require('https');
const crypto = require('crypto');
const dotenv = require('dotenv');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const flash = require('connect-flash');


const calculatorRoutes = require('./routes/calculatorRoutes');
const { connectToDatabase, getDb } = require('./data/database');
const registrationRoutes = require('./routes/registration');
const symptomRoutes = require('./routes/symptomRoutes');
const secondaryConditionRoutes = require('./routes/secondaryConditionRoutes');
const authRoutes = require('./routes/auth');
//const contactRoutes = require('./routes/contact');

dotenv.config();

const app = express();
const port = 3000;

const systemImages = {
  'Dental and Oral Conditions': '512px-202402_Oral_Cavity.svg.png',
  'Hemic and Lymphatic Systems': '512px-2201_Anatomy_of_the_Lymphatic_System.jpg',
  'Cardiovascular system': '512px-Circulatory_System_en_edited.svg.png',
  'Skin': '512px-Dermatology_-_Integumentary_system_1_--_Smart-Servier.png',
  'Digestive System': '512px-Digestive_system_diagram_en.svg.png',
  'Endocrine system': '512px-Endocrine_English.svg.png',
  'Gynecological conditions and disprders of the breast': '512px-Female_genital_system_-_Sagittal_view.svg.png',
  'Eye': '512px-Lateral_orbit_nerves_chngd.jpg',
  'Genitourinary system': '512px-Male_and_female_genital_organs.svg.png',
  'Musculoskeletal system': '512px-Muscles_front_and_back-es.png',
  'Respiratory system': '512px-Respiratory_system_complete_fr_simplified.svg.png',
  'Nervous System': '512px-TE-Nervous_system_diagram.svg.png',
  'Ear': 'Auditory_System.jpg',
  'Sense Organs': 'Sense-Organ.png',
};

const sessionStore = new MySQLStore({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
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
    secure: true,
  }
}));

// Helmet CSP middleware with dynamic nonce
app.use((req, res, next) => {
  res.locals.nonce = crypto.randomBytes(16).toString('base64');
  next();
});

app.use((req, res, next) => {
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'",
        `'nonce-${res.locals.nonce}'`,  // IMPORTANT: this string must be wrapped in quotes here
        "https://accounts.google.com",
        "https://apis.google.com"
      ],
      styleSrc: ["'self'", "'unsafe-inline'", "https://accounts.google.com"],
      frameSrc: ["'self'", "https://accounts.google.com"],
      connectSrc: ["'self'", "https://accounts.google.com", "https://play.google.com"]
    }
  })(req, res, next);
});


// Middleware to parse JSON and URL-encoded bodies
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(flash()); //added 

app.use('/api', calculatorRoutes);
app.use('/api', secondaryConditionRoutes);

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'images')));

// CSRF protection setup
const csrfProtection = csrf();
app.use(csrfProtection);

app.use((req, res, next) => {
  res.locals.successMessage = req.flash('success');
  res.locals.errorMessage = req.flash('error');
  next();
});

// Debugging middleware
app.use((req, res, next) => {
  console.log('Generated Nonce:', res.locals.nonce);
  console.log('Incoming X-CSRF-Token:', req.headers['x-csrf-token']);
  console.log('Session cookie:', req.headers.cookie);
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

app.use(async function (req, res, next) {
  res.locals.isAuth = req.session.isAuthenticated || false;
  if (req.session.isAuthenticated) {
    try {
      const db = getDb();
      let results;
      if (req.session.user && req.session.user.google_id) {
        // Google user
        [results] = await db.execute('SELECT * FROM google_users WHERE id = ?', [req.session.user.id]);
      } else {
        // Regular user
        [results] = await db.execute('SELECT * FROM users WHERE id = ?', [req.session.user.id]);
      }
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

// Auth status and user loader
// app.use(async function (req, res, next) {
//   res.locals.isAuth = req.session.isAuthenticated || false;
//   if (req.session.isAuthenticated) {
//     try {
//       const db = getDb();
//       const [results] = await db.execute('SELECT * FROM users WHERE id = ?', [req.session.user.id]);
//       if (results.length > 0) {
//         res.locals.user = results[0];
//         req.user = results[0];
//         console.log('User:', res.locals.user);
//       } else {
//         req.session.isAuthenticated = false;
//         console.log('User not found:', req.session.user.id);
//       }
//     } catch (err) {
//       console.error('Error fetching user:', err);
//       req.session.isAuthenticated = false;
//     }
//   }
//   console.log('Middleware - isAuth:', res.locals.isAuth);
//   next();
// });

// CSRF error handler
app.use((err, req, res, next) => {
  if (err.code === 'EBADCSRFTOKEN') {
    console.error("CSRF Token Error on route:", req.originalUrl);
    return res.status(403).send('Form tampered with');
  }
  next(err);
});

// Set view engine
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Routes
app.use(registrationRoutes);
app.use('/symptoms', symptomRoutes);
app.use('/auth', authRoutes);
//app.use('/', contactRoutes);


app.get('/', (req, res) => {
  res.render('index', {
  message: null,
  csrfToken: req.csrfToken(),
  nonce: res.locals.nonce
});
});

app.get('/calculator', (req, res) => {
  res.render('calculator', {
    message: null,
    csrfToken: req.csrfToken(),
    nonce: res.locals.nonce
  });
});

app.get('/contact-confirmation', (req, res) => {
  console.log('✅ GET /contact-confirmation hit — query.message:', req.query.message);
  res.send(`<h1>Message = ${req.query.message}</h1>`);
});

app.get('/secondary', (req, res) => {
  console.log('Rendering secondary with CSRF token:', req.csrfToken());
  res.render('secondary', {
    csrfToken: req.csrfToken(),
    isAuth: req.session.isAuthenticated,
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
      systems: systems.map(row => row.systems),
      
    });
  } catch (err) {
    console.error('Error fetching systems:', err);
    res.status(500).send('Error fetching systems');
  }
});

app.get('/terms', (req, res) => {
  res.render('terms', {
    nonce: res.locals.nonce || '',
    csrfToken: req.csrfToken()
  });
});

app.get('/policy', (req, res) => {
  res.render('policy', {
    nonce: res.locals.nonce || '',
    csrfToken: req.csrfToken()
  });
});

// Generic error handler
app.use((err, req, res, next) => {
  console.error('Express error:', err);
  res.status(500).send('An error occurred on the server');
});

// Start server after DB connection
async function startServer() {
  try {
    await connectToDatabase();
    console.log('Database connection established');

    const db = getDb();
    const [testResult] = await db.execute('SELECT 1 as test');
    console.log('Database test query result:', testResult);

    const privateKey = fs.readFileSync('server.key', 'utf8');
    const certificate = fs.readFileSync('server.cert', 'utf8');
    const credentials = { key: privateKey, cert: certificate };

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

startServer().catch((err) => {
  console.error('Unhandled error during server startup:', err);
  process.exit(1);
});




