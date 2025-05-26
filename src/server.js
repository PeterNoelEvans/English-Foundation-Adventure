require('dotenv').config();
console.log('DATABASE_URL:', process.env.DATABASE_URL);
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { PrismaClient } = require('@prisma/client');
const authRoutes = require('./routes/auth');
const questionsRoutes = require('./routes/questions');
const unitsRoutes = require('./routes/units');

// Load environment variables
dotenv.config();

const app = express();
const prisma = new PrismaClient();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/questions', questionsRoutes);
app.use('/api/units', unitsRoutes);

// Basic route for testing
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to English Foundation Learning Platform' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}); 