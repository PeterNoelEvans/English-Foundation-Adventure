const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { body, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const requireRole = auth.requireRole;

const prisma = new PrismaClient();

// Get all classrooms for the organization
router.get('/', auth, requireRole(['ADMIN', 'TEACHER']), async (req, res) => {
  try {
    const classrooms = await prisma.classroom.findMany({
      where: {
        organizationId: req.user.organizationId,
        isActive: true
      },
      include: {
        students: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            studentNumber: true
          }
        },
        courses: {
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

// Get students in a specific classroom
router.get('/:classroomId/students', auth, requireRole(['ADMIN', 'TEACHER']), async (req, res) => {
  try {
    const { classroomId } = req.params;

    const classroom = await prisma.classroom.findFirst({
      where: {
        id: classroomId,
        organizationId: req.user.organizationId
      },
      include: {
        students: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            studentNumber: true,
            active: true,
            lastLogin: true
          }
        }
      }
    });

    if (!classroom) {
      return res.status(404).json({ message: 'Classroom not found' });
    }

    res.json({ 
      classroom,
      students: classroom.students 
    });
  } catch (error) {
    console.error('Get classroom students error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Progress entire class to next year level
router.post('/:classroomId/progress', [
  auth,
  requireRole(['ADMIN', 'TEACHER']),
  body('newYearLevel').isIn(['P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'M1', 'M2', 'M3', 'M4', 'M5', 'M6', 'ADULT', 'ADVANCED', 'IN_HOUSE']).withMessage('Valid year level is required'),
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
    const newClassroom = await prisma.classroom.findFirst({
      where: {
        organizationId: req.user.organizationId,
        yearLevel: newYearLevel,
        classNum: targetClassNum
      }
    });

    let targetClassroom;
    if (newClassroom) {
      targetClassroom = newClassroom;
    } else {
      targetClassroom = await prisma.classroom.create({
        data: {
          organizationId: req.user.organizationId,
          yearLevel: newYearLevel,
          classNum: targetClassNum,
          name: `${newYearLevel} Class ${targetClassNum}`
        }
      });
    }

    // Update all students in the class
    const updatePromises = classroom.students.map(student => 
      prisma.user.update({
        where: { id: student.id },
        data: { classroomId: targetClassroom.id }
      })
    );

    await Promise.all(updatePromises);

    // Get updated students
    const updatedStudents = await prisma.user.findMany({
      where: { classroomId: targetClassroom.id },
      include: {
        classroom: true
      }
    });

    res.json({
      message: `Successfully progressed ${updatedStudents.length} students from ${classroom.yearLevel}/${classroom.classNum} to ${newYearLevel}/${targetClassNum}`,
      previousClassroom: classroom,
      newClassroom: targetClassroom,
      updatedStudents: updatedStudents.length
    });
  } catch (error) {
    console.error('Bulk year level progression error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Assign courses to a classroom
router.post('/:classroomId/courses', [
  auth,
  requireRole(['ADMIN', 'TEACHER']),
  body('courseIds').isArray().withMessage('Course IDs must be an array')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { classroomId } = req.params;
    const { courseIds } = req.body;

    // Verify the classroom exists and belongs to the teacher's organization
    const classroom = await prisma.classroom.findFirst({
      where: {
        id: classroomId,
        organizationId: req.user.organizationId
      }
    });

    if (!classroom) {
      return res.status(404).json({ message: 'Classroom not found' });
    }

    // Verify all courses exist and belong to the organization
    const courses = await prisma.course.findMany({
      where: {
        id: { in: courseIds },
        subject: {
          organizationId: req.user.organizationId
        }
      }
    });

    if (courses.length !== courseIds.length) {
      return res.status(400).json({ message: 'One or more courses not found' });
    }

    // Update classroom-course relationships
    await prisma.classroom.update({
      where: { id: classroomId },
      data: {
        courses: {
          connect: courseIds.map(id => ({ id }))
        }
      }
    });

    res.json({
      message: `Successfully assigned ${courses.length} courses to ${classroom.yearLevel}/${classroom.classNum}`,
      classroom,
      courses
    });
  } catch (error) {
    console.error('Assign courses to classroom error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 