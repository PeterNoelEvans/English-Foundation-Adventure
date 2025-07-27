const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const auth = require('../middleware/auth');
const requireRole = auth.requireRole;

const prisma = new PrismaClient();

// Get available subjects for student enrollment
router.get('/subjects', auth, requireRole(['STUDENT']), async (req, res) => {
  try {
    const student = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { organizationId: true }
    });

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    const subjects = await prisma.subject.findMany({
      where: { 
        organizationId: student.organizationId,
        isArchived: false 
      },
      select: {
        id: true,
        name: true,
        description: true,
        courses: {
          where: { isArchived: false },
          select: {
            id: true,
            name: true,
            description: true
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    res.json({ subjects });
  } catch (error) {
    console.error('Get subjects error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get courses for a specific subject
router.get('/courses/:subjectId', auth, requireRole(['STUDENT']), async (req, res) => {
  try {
    const { subjectId } = req.params;
    
    const student = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { organizationId: true }
    });

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    const courses = await prisma.course.findMany({
      where: { 
        subjectId,
        subject: { organizationId: student.organizationId },
        isArchived: false 
      },
      select: {
        id: true,
        name: true,
        description: true,
        subject: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    res.json({ courses });
  } catch (error) {
    console.error('Get courses error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Enroll student in a course
router.post('/enroll', auth, requireRole(['STUDENT']), [
  body('courseId').isString().notEmpty().withMessage('Course ID is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { courseId } = req.body;

    const student = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { organizationId: true }
    });

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Check if course exists and belongs to student's organization
    const course = await prisma.course.findFirst({
      where: { 
        id: courseId,
        subject: { organizationId: student.organizationId },
        isArchived: false 
      }
    });

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Check if already enrolled
    const existingEnrollment = await prisma.studentCourse.findUnique({
      where: {
        studentId_courseId: {
          studentId: req.user.userId,
          courseId
        }
      }
    });

    if (existingEnrollment) {
      return res.status(400).json({ message: 'Already enrolled in this course' });
    }

    // Create enrollment
    const enrollment = await prisma.studentCourse.create({
      data: {
        studentId: req.user.userId,
        courseId
      },
      include: {
        course: {
          select: {
            id: true,
            name: true,
            subject: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    });

    res.status(201).json({ 
      message: 'Successfully enrolled in course',
      enrollment 
    });
  } catch (error) {
    console.error('Enroll error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Unenroll from a course
router.delete('/unenroll/:courseId', auth, requireRole(['STUDENT']), async (req, res) => {
  try {
    const { courseId } = req.params;

    const enrollment = await prisma.studentCourse.findUnique({
      where: {
        studentId_courseId: {
          studentId: req.user.userId,
          courseId
        }
      }
    });

    if (!enrollment) {
      return res.status(404).json({ message: 'Enrollment not found' });
    }

    await prisma.studentCourse.delete({
      where: {
        studentId_courseId: {
          studentId: req.user.userId,
          courseId
        }
      }
    });

    res.json({ message: 'Successfully unenrolled from course' });
  } catch (error) {
    console.error('Unenroll error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get student's enrolled courses
router.get('/my-courses', auth, requireRole(['STUDENT']), async (req, res) => {
  try {
    const enrollments = await prisma.studentCourse.findMany({
      where: { studentId: req.user.userId },
      include: {
        course: {
          select: {
            id: true,
            name: true,
            description: true,
            subject: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      },
      orderBy: {
        course: {
          subject: { name: 'asc' }
        }
      }
    });

    res.json({ enrollments });
  } catch (error) {
    console.error('Get my courses error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 