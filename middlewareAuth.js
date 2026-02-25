// middleware/auth.js
// Attach this to any route that requires a logged-in user.
// Usage:  router.get('/protected', auth, handler)

const jwt = require('jsonwebtoken');

module.exports = function auth(req, res, next) {
  const header = req.headers.authorization || '';

  if (!header.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token — please sign in first.' });
  }

  const token = header.split(' ')[1];

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (err) {
    const msg = err.name === 'TokenExpiredError'
      ? 'Your session has expired. Please sign in again.'
      : 'Invalid token. Please sign in again.';
    res.status(401).json({ message: msg });
  }
};

