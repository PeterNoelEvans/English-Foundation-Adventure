const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const { body, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const requireRole = auth.requireRole;
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const prisma = new PrismaClient();

// Configure multer for profile picture uploads
const profilePictureStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../../uploads/profile-pictures');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'profile-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const profilePictureUpload = multer({ 
  storage: profilePictureStorage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.'), false);
    }
  }
});

// Organization mapping based on organization codes
const organizationMapping = {
  'pbs': 'PBS',
  'hospital': 'HOSPITAL',
  'coding-school': 'CODING'
};

// Helper function to get or create organization
async function getOrCreateOrganization(orgCode) {
  const orgName = organizationMapping[orgCode] || 'PBS';
  
  let organization = await prisma.organization.findFirst({
    where: { code: orgName }
  });
  
  if (!organization) {
    organization = await prisma.organization.create({
      data: {
        name: orgName,
        code: orgName,
        domain: `${orgCode}.yourdomain.com`
      }
    });
  }
  
  return organization;
}

// Helper function to get or create classroom
async function getOrCreateClassroom(organizationId, yearLevel, classNum = '1') {
  let classroom = await prisma.classroom.findFirst({
    where: {
      organizationId,
      yearLevel,
      classNum
    }
  });
  
  if (!classroom) {
    classroom = await prisma.classroom.create({
      data: {
        organizationId,
        yearLevel,
        classNum,
        name: `${yearLevel} Class ${classNum}`
      }
    });
  }
  
  return classroom;
}

// Login route
router.post('/login', [
  body('email').isEmail(),
  body('password').notEmpty(),
  body('organization').optional()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, organization } = req.body;
    
    // Get organization
    const orgCode = organization || 'pbs';
    const org = await getOrCreateOrganization(orgCode);

    // Find user in the specific organization
    const user = await prisma.user.findFirst({ 
      where: { 
        email,
        organizationId: org.id
      },
      include: {
        organization: true,
        classroom: true
      }
    });

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Create session
    const session = await prisma.userSession.create({
      data: {
        userId: user.id,
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.headers['user-agent']
      }
    });

    const token = jwt.sign(
      { 
        userId: user.id, 
        role: user.role,
        organizationId: user.organizationId,
        classroomId: user.classroomId
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        organization: user.organization,
        classroom: user.classroom
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Register route
router.post('/register', [
  body('email').isEmail(),
  body('password').isLength({ min: 6 }),
  body('firstName').notEmpty(),
  body('lastName').notEmpty(),
  body('role').isIn(['TEACHER', 'STUDENT']),
  body('yearLevel').optional().isIn(['P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'M1', 'M2', 'M3', 'M4', 'M5', 'M6']),
  body('classNum').optional().isIn(['1', '2', '3', '4', '5', '6']),
  body('organization').optional()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, firstName, lastName, role, yearLevel, classNum, organization } = req.body;

    // Get organization
    const orgCode = organization || 'pbs';
    const org = await getOrCreateOrganization(orgCode);

    // Check if user already exists in this organization
    const existingUser = await prisma.user.findFirst({ 
      where: { 
        email,
        organizationId: org.id
      } 
    });
    
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists in this organization' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user data object
    const userData = {
      email,
      password: hashedPassword,
      firstName,
      lastName,
      role,
      organizationId: org.id
    };

    // Add classroom for students
    if (role === 'STUDENT' && yearLevel && classNum) {
      const classroom = await getOrCreateClassroom(org.id, yearLevel, classNum);
      userData.classroomId = classroom.id;
    }

    // Create user
    const user = await prisma.user.create({
      data: userData,
      include: {
        organization: true,
        classroom: true
      }
    });

    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        organization: user.organization,
        classroom: user.classroom
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get current user info
router.get('/me', auth, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      include: {
        organization: true,
        classroom: true
      }
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update student classroom (admin/teacher only)
router.patch('/users/:userId/classroom', [
  auth,
  requireRole(['ADMIN', 'TEACHER']),
  body('yearLevel').isIn(['P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'M1', 'M2', 'M3', 'M4', 'M5', 'M6']),
  body('classNum').isIn(['1', '2', '3', '4', '5', '6'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { userId } = req.params;
    const { yearLevel, classNum } = req.body;

    // Check if user exists and is a student
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.role !== 'STUDENT') {
      return res.status(400).json({ message: 'Can only update classroom for students' });
    }

    // Get or create the new classroom
    const classroom = await getOrCreateClassroom(user.organizationId, yearLevel, classNum);

    // Update the student's classroom
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { classroomId: classroom.id },
      include: {
        organization: true,
        classroom: true
      }
    });

    res.json({
      message: 'Student classroom updated successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Update classroom error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Bulk year level progression for entire class (admin/teacher only)
router.post('/classroom/:classroomId/progress', [
  auth,
  requireRole(['ADMIN', 'TEACHER']),
  body('newYearLevel').isIn(['P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'M1', 'M2', 'M3', 'M4', 'M5', 'M6']).withMessage('Valid year level is required'),
  body('newClassNum').optional().isIn(['1', '2', '3', '4', '5', '6'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { classroomId } = req.params;
    const { newYearLevel, newClassNum } = req.body;

    // Verify the classroom exists and belongs to the teacher's organization
    const classroom = await prisma.classroom.findFirst({
      where: {
        id: classroomId,
        organizationId: req.user.organizationId
      },
      include: {
        students: true
      }
    });

    if (!classroom) {
      return res.status(404).json({ message: 'Classroom not found' });
    }

    // Get or create the new classroom
    const targetClassNum = newClassNum || classroom.classNum;
    const newClassroom = await getOrCreateClassroom(req.user.organizationId, newYearLevel, targetClassNum);

    // Update all students in the class
    const updatePromises = classroom.students.map(student => 
      prisma.user.update({
        where: { id: student.id },
        data: { classroomId: newClassroom.id }
      })
    );

    await Promise.all(updatePromises);

    // Get updated students
    const updatedStudents = await prisma.user.findMany({
      where: { classroomId: newClassroom.id },
      include: {
        classroom: true
      }
    });

    res.json({
      message: `Successfully progressed ${updatedStudents.length} students from ${classroom.yearLevel}/${classroom.classNum} to ${newYearLevel}/${targetClassNum}`,
      previousClassroom: classroom,
      newClassroom: newClassroom,
      updatedStudents: updatedStudents.length
    });
  } catch (error) {
    console.error('Bulk year level progression error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all students with their classrooms (admin/teacher only)
router.get('/students', auth, requireRole(['ADMIN', 'TEACHER']), async (req, res) => {
  try {
    const students = await prisma.user.findMany({
      where: {
        role: 'STUDENT',
        organizationId: req.user.organizationId // Only show students from the same organization
      },
      include: {
        classroom: true,
        organization: true
      },
      orderBy: [
        { classroom: { yearLevel: 'asc' } },
        { classroom: { classNum: 'asc' } },
        { lastName: 'asc' },
        { firstName: 'asc' }
      ]
    });

    res.json({ students });
  } catch (error) {
    console.error('Get students error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update user profile (any authenticated user can update their own profile)
router.patch('/profile', auth, [
  body('firstName').optional().notEmpty().withMessage('First name cannot be empty'),
  body('lastName').optional().notEmpty().withMessage('Last name cannot be empty'),
  body('email').optional().isEmail().withMessage('Valid email is required'),
  body('nickname').optional(),
  body('password').optional().isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('profilePicture').optional()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { firstName, lastName, email, nickname, password, profilePicture } = req.body;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: req.user.userId }
    });

    if (!existingUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // If email is being changed, check for duplicates
    if (email && email !== existingUser.email) {
      const duplicateUser = await prisma.user.findFirst({
        where: {
          email,
          organizationId: existingUser.organizationId,
          id: { not: existingUser.id }
        }
      });

      if (duplicateUser) {
        return res.status(400).json({ message: 'Email already exists in this organization' });
      }
    }

    const updateData = {};
    if (firstName) updateData.firstName = firstName;
    if (lastName) updateData.lastName = lastName;
    if (email) updateData.email = email;
    if (nickname !== undefined) updateData.nickname = nickname;
    if (profilePicture !== undefined) updateData.profilePicture = profilePicture;

    // Hash password if provided
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    const updatedUser = await prisma.user.update({
      where: { id: req.user.userId },
      data: updateData,
      include: {
        organization: true,
        classroom: true
      }
    });

    // Remove password from response
    const { password: _, ...userWithoutPassword } = updatedUser;

    res.json({
      message: 'Profile updated successfully',
      user: userWithoutPassword
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update student profile (teachers can update student profiles)
router.patch('/students/:studentId', auth, requireRole(['ADMIN', 'TEACHER']), [
  body('firstName').optional().notEmpty().withMessage('First name cannot be empty'),
  body('lastName').optional().notEmpty().withMessage('Last name cannot be empty'),
  body('email').optional().isEmail().withMessage('Valid email is required'),
  body('nickname').optional(),
  body('password').optional().isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('profilePicture').optional(),
  body('gradeLevel').optional().isIn(['P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'M1', 'M2', 'M3', 'M4', 'M5', 'M6'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { studentId } = req.params;
    const { firstName, lastName, email, nickname, password, profilePicture, gradeLevel } = req.body;

    // Check if student exists and belongs to teacher's organization
    const existingStudent = await prisma.user.findFirst({
      where: {
        id: studentId,
        role: 'STUDENT',
        organizationId: req.user.organizationId
      },
      include: {
        classroom: true
      }
    });

    if (!existingStudent) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // If email is being changed, check for duplicates
    if (email && email !== existingStudent.email) {
      const duplicateUser = await prisma.user.findFirst({
        where: {
          email,
          organizationId: req.user.organizationId,
          id: { not: studentId }
        }
      });

      if (duplicateUser) {
        return res.status(400).json({ message: 'Email already exists in this organization' });
      }
    }

    const updateData = {};
    if (firstName) updateData.firstName = firstName;
    if (lastName) updateData.lastName = lastName;
    if (email) updateData.email = email;
    if (nickname !== undefined) updateData.nickname = nickname;
    if (profilePicture !== undefined) updateData.profilePicture = profilePicture;

    // Hash password if provided
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    // Update classroom if grade level is being changed
    if (gradeLevel && gradeLevel !== existingStudent.classroom?.yearLevel) {
      const newClassroom = await getOrCreateClassroom(req.user.organizationId, gradeLevel);
      updateData.classroomId = newClassroom.id;
    }

    const updatedStudent = await prisma.user.update({
      where: { id: studentId },
      data: updateData,
      include: {
        organization: true,
        classroom: true
      }
    });

    // Remove password from response
    const { password: _, ...studentWithoutPassword } = updatedStudent;

    res.json({
      message: 'Student profile updated successfully',
      student: studentWithoutPassword
    });
  } catch (error) {
    console.error('Update student profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get students by classroom (for class view)
router.get('/classroom/:classroomId/students', auth, requireRole(['ADMIN', 'TEACHER']), async (req, res) => {
  try {
    const { classroomId } = req.params;

    // Verify classroom belongs to teacher's organization
    const classroom = await prisma.classroom.findFirst({
      where: {
        id: classroomId,
        organizationId: req.user.organizationId
      }
    });

    if (!classroom) {
      return res.status(404).json({ message: 'Classroom not found' });
    }

    const students = await prisma.user.findMany({
      where: {
        role: 'STUDENT',
        classroomId: classroomId,
        organizationId: req.user.organizationId
      },
      include: {
        classroom: true,
        organization: true
      },
      orderBy: [
        { lastName: 'asc' },
        { firstName: 'asc' }
      ]
    });

    res.json({ 
      students,
      classroom: {
        id: classroom.id,
        yearLevel: classroom.yearLevel,
        classNum: classroom.classNum,
        name: `${classroom.yearLevel}/${classroom.classNum}`
      }
    });
  } catch (error) {
    console.error('Get classroom students error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all classrooms for teacher's organization
router.get('/classrooms', auth, requireRole(['ADMIN', 'TEACHER']), async (req, res) => {
  try {
    const classrooms = await prisma.classroom.findMany({
      where: {
        organizationId: req.user.organizationId
      },
      include: {
        students: {
          where: { role: 'STUDENT' },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            profilePicture: true,
            lastLogin: true
          }
        }
      },
      orderBy: [
        { yearLevel: 'asc' },
        { classNum: 'asc' }
      ]
    });

    res.json({ classrooms });
  } catch (error) {
    console.error('Get classrooms error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Upload profile picture
router.post('/profile-picture', auth, profilePictureUpload.single('profilePicture'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId }
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Delete old profile picture if it exists
    if (user.profilePicture) {
      const oldPicturePath = path.join(__dirname, '../../uploads/profile-pictures', user.profilePicture);
      if (fs.existsSync(oldPicturePath)) {
        fs.unlinkSync(oldPicturePath);
      }
    }

    // Update user with new profile picture path
    const updatedUser = await prisma.user.update({
      where: { id: req.user.userId },
      data: {
        profilePicture: req.file.filename
      },
      include: {
        organization: true,
        classroom: true
      }
    });

    // Remove password from response
    const { password: _, ...userWithoutPassword } = updatedUser;

    res.json({
      message: 'Profile picture uploaded successfully',
      user: userWithoutPassword,
      profilePicture: req.file.filename
    });
  } catch (error) {
    console.error('Profile picture upload error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Serve profile pictures
router.get('/profile-pictures/:filename', (req, res) => {
  const { filename } = req.params;
  const filePath = path.join(__dirname, '../../uploads/profile-pictures', filename);
  
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).json({ message: 'Profile picture not found' });
  }
});

// Logout route
router.post('/logout', auth, async (req, res) => {
  try {
    // Find the most recent active session for this user
    const activeSession = await prisma.userSession.findFirst({
      where: {
        userId: req.user.userId,
        endTime: null // Session is still active
      },
      orderBy: {
        startTime: 'desc'
      }
    });

    if (activeSession) {
      // End the session
      const endTime = new Date();
      const duration = Math.floor((endTime.getTime() - activeSession.startTime.getTime()) / 1000);
      
      await prisma.userSession.update({
        where: { id: activeSession.id },
        data: {
          endTime: endTime,
          duration: duration
        }
      });
    }

    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Session heartbeat endpoint
router.post('/session/ping', auth, async (req, res) => {
  try {
    await prisma.userSession.updateMany({
      where: {
        userId: req.user.userId,
        endTime: null
      },
      data: { lastActive: new Date() }
    });
    res.json({ success: true });
  } catch (error) {
    console.error('Session ping error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router; 