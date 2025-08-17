const jwt = require('jsonwebtoken');

// JWT Secret - must be set in environment variables for security
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error('SECURITY WARNING: JWT_SECRET environment variable is not set!');
  process.exit(1);
}

module.exports = (req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ error: 'No token' });
  const token = auth.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
};
