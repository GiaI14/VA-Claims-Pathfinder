const express = require('express');
const router = express.Router();

// Route to render claim filing page
router.get('/claimfiling', (req, res) => {
  res.render('claimFiling', {
    csrfToken: req.csrfToken(),
    nonce: res.locals.nonce
  });
});

module.exports = router;
