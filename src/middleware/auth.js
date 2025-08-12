const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    console.log('Auth middleware - Token received:', token ? 'Yes' : 'No');
    console.log('Auth middleware - Headers:', req.headers);
    
    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Auth middleware - Decoded token:', decoded);
    
    console.log('Auth middleware - Looking for user with ID:', decoded.userId);
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });

    console.log('Auth middleware - User found:', user ? 'Yes' : 'No');
    if (user) {
      console.log('Auth middleware - User details:', { id: user.id, email: user.email, role: user.role });
    }

    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    req.user = user;
    req.user.userId = user.id; // Add this for compatibility
    req.user.organizationId = decoded.organizationId; // Extract organizationId from JWT
    req.token = token;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({ message: 'Please authenticate' });
  }
};

const requireRole = (roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied' });
    }
    next();
  };
};

module.exports = auth;
module.exports.requireRole = requireRole; 
// Superuser access: allow ADMINs or users whose email is listed in SUPERUSER_EMAILS
module.exports.requireSuperuser = (req, res, next) => {
  try {
    const superEmails = (process.env.SUPERUSER_EMAILS || '')
      .split(',')
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);

    const userEmail = (req.user.email || '').toLowerCase();
    if (req.user.role === 'ADMIN' || superEmails.includes(userEmail)) {
      return next();
    }
    return res.status(403).json({ message: 'Superuser access required' });
  } catch (err) {
    return res.status(403).json({ message: 'Superuser access required' });
  }
};