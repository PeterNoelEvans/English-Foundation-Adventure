const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
console.log('DATABASE_URL:', process.env.DATABASE_URL);
const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const authRoutes = require('./routes/auth');
const questionsRoutes = require('./routes/questions');
const unitsRoutes = require('./routes/units');
const subjectsRoutes = require('./routes/subjects');
const coursesRoutes = require('./routes/courses');
const resourcesRoutes = require('./routes/resources');
const analyticsRoutes = require('./routes/analytics');
const assignmentsRoutes = require('./routes/assignments');
const enrollmentRoutes = require('./routes/enrollment');
const classroomsRoutes = require('./routes/classrooms');
const progressRoutes = require('./routes/progress');
const organizationsRoutes = require('./routes/organizations');
const chatRoutes = require('./routes/chat');

// Environment variables already loaded above

const app = express();
const prisma = new PrismaClient();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static file serving for uploads
app.use('/uploads', express.static('uploads'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/questions', questionsRoutes);
app.use('/api/units', unitsRoutes);
app.use('/api/subjects', subjectsRoutes);
app.use('/api/courses', coursesRoutes);
app.use('/api/resources', resourcesRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/assignments', assignmentsRoutes);
app.use('/api/enrollment', enrollmentRoutes);
app.use('/api/classrooms', classroomsRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/organizations', organizationsRoutes);
app.use('/api/chat', chatRoutes);

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