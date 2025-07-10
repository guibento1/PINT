//web\backend\src\middleware.js
const path = require('path');
const jwt = require('jsonwebtoken');

require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const SECRET = process.env.JWTSECRET;

function generateAccessToken(user) {
  return jwt.sign(user, SECRET, { expiresIn: '15d' });
}

function authenticateJWT(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Missing token' });
  }
  
  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, SECRET);
    req.user = decoded;
    next();
  } catch(error) {
    return res.status(403).json({ message: 'Invalid token' });
  }
}


function authorizeRoles(...allowedRoles) {

  return (req, res, next) => {

    if ( !req.user || !req.user.roles || req.user.roles.length == 0  ) {
      return res.status(403).json({ message: 'No roles assigned' });
    }

    const userRoles = req.user.roles.map((roleEntry) => roleEntry.role); 

    const hasRole = userRoles.some(role => allowedRoles.includes(role));

    if (!hasRole) {
      return res.status(403).json({ message: 'Forbidden: insufficient permissions' });
    }

    next();
  };

}

module.exports = { generateAccessToken, authenticateJWT, authorizeRoles };
