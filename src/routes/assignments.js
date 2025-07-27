const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { body, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const requireRole = auth.requireRole;

const router = express.Router();
const prisma = new PrismaClient();

// Get all assignments for a student (filtered by their organization and courses)
router.get('/', auth, requireRole(['STUDENT']), async (req, res) => {
  try {
    const student = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { 
        organizationId: true,
        classroomId: true,
        studentCourses: {
          select: { courseId: true }
        }
      }
    });

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Get assignments for courses the student is enrolled in
    const enrolledCourseIds = student.studentCourses.map(sc => sc.courseId);

    // If student is not enrolled in any courses, return empty array instead of error
    if (enrolledCourseIds.length === 0) {
      return res.json({ assignments: [] });
    }

    const assignments = await prisma.assessment.findMany({
      where: {
        courseId: { in: enrolledCourseIds },
        published: true,
        course: {
          organizationId: student.organizationId
        }
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
        },
        unit: {
          select: {
            id: true,
            name: true,
            order: true
          }
        },
        resources: {
          select: {
            id: true,
            title: true,
            description: true,
            type: true,
            fileSize: true,
            createdAt: true
          }
        },
        submissions: {
          where: { studentId: req.user.userId },
          select: {
            id: true,
            score: true,
            submittedAt: true,
            attempts: true
          }
        }
      },
      orderBy: [
        { course: { name: 'asc' } },
        { unit: { order: 'asc' } },
        { createdAt: 'asc' }
      ]
    });

    res.json({ assignments });
  } catch (error) {
    console.error('Error fetching assignments:', error);
    res.status(500).json({ message: 'Failed to fetch assignments' });
  }
});

// Create a new assignment
router.post('/', auth, requireRole(['TEACHER']), [
  body('title').notEmpty().withMessage('Assignment title is required'),
  body('description').optional(),
  body('type').isIn(['multiple-choice', 'true-false', 'matching', 'drag-and-drop', 'writing', 'writing-long', 'speaking', 'assignment', 'listening']).withMessage('Valid assessment type is required'),
  body('subtype').optional().isIn(['ordering', 'categorization', 'fill-blank', 'labeling']).withMessage('Valid subtype is required for drag-and-drop'),
  body('category').optional(),
  body('difficulty').optional().isIn(['beginner', 'intermediate', 'advanced']).withMessage('Difficulty must be beginner, intermediate, or advanced'),
  body('timeLimit').optional().isInt({ min: 1 }).withMessage('Time limit must be a positive integer'),
  body('points').optional().isInt({ min: 1 }).withMessage('Points must be a positive integer'),
  body('questions').optional(),
  body('instructions').optional(),
  body('criteria').optional(),
  body('autoGrade').optional().isBoolean().withMessage('Auto grade must be a boolean'),
  body('showFeedback').optional().isBoolean().withMessage('Show feedback must be a boolean'),
  body('dueDate').optional().isISO8601().withMessage('Due date must be a valid date'),
  body('availableFrom').optional().isISO8601().withMessage('Available from must be a valid date'),
  body('availableTo').optional().isISO8601().withMessage('Available to must be a valid date'),
  body('quarter').optional().isIn(['Q1', 'Q2', 'Q3', 'Q4']).withMessage('Quarter must be Q1, Q2, Q3, or Q4'),
  body('maxAttempts').optional().isInt({ min: 1 }).withMessage('Max attempts must be a positive integer'),
  body('shuffleQuestions').optional().isBoolean().withMessage('Shuffle questions must be a boolean'),
  body('allowReview').optional().isBoolean().withMessage('Allow review must be a boolean'),
  body('tags').optional().isArray().withMessage('Tags must be an array'),
  body('courseId').optional(),
  body('unitId').optional(),
  body('partId').optional(),
  body('sectionId').optional(),
  body('topicId').optional(),
  body('published').optional().isBoolean().withMessage('Published must be a boolean')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      title,
      description,
      type,
      subtype,
      category,
      difficulty,
      timeLimit,
      points = 1,
      questions,
      instructions,
      criteria,
      autoGrade = true,
      showFeedback = true,
      dueDate,
      availableFrom,
      availableTo,
      quarter = 'Q1',
      maxAttempts,
      shuffleQuestions = false,
      allowReview = true,
      tags = [],
      courseId,
      unitId,
      partId,
      sectionId,
      topicId,
      published = true
    } = req.body;

    // Verify the teacher exists and get their organization
    const teacher = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { organizationId: true }
    });

    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found' });
    }

    // If courseId is provided, verify it belongs to the teacher's organization
    if (courseId) {
      const course = await prisma.course.findFirst({
        where: {
          id: courseId,
          subject: {
            organizationId: teacher.organizationId
          }
        }
      });

      if (!course) {
        return res.status(404).json({ message: 'Course not found or not accessible' });
      }
    }

    // If unitId is provided, verify it belongs to the teacher's organization
    if (unitId) {
      const unit = await prisma.unit.findFirst({
        where: {
          id: unitId,
          course: {
            subject: {
              organizationId: teacher.organizationId
            }
          }
        }
      });

      if (!unit) {
        return res.status(404).json({ message: 'Unit not found or not accessible' });
      }
    }

    // Create the assignment
    const assignment = await prisma.assessment.create({
      data: {
        title,
        description,
        type,
        subtype,
        category,
        difficulty,
        timeLimit,
        points,
        questions,
        instructions,
        criteria,
        autoGrade,
        showFeedback,
        dueDate: dueDate ? new Date(dueDate) : null,
        availableFrom: availableFrom ? new Date(availableFrom) : null,
        availableTo: availableTo ? new Date(availableTo) : null,
        quarter,
        maxAttempts,
        shuffleQuestions,
        allowReview,
        tags,
        published,
        createdById: req.user.userId,
        courseId,
        unitId,
        partId,
        sectionId,
        topicId
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
        },
        unit: {
          select: {
            id: true,
            name: true,
            order: true
          }
        },
        resources: {
          select: {
            id: true,
            title: true,
            description: true,
            type: true,
            fileSize: true,
            createdAt: true
          }
        }
      }
    });

    res.status(201).json({ 
      message: 'Assignment created successfully', 
      assignment 
    });
  } catch (error) {
    console.error('Error creating assignment:', error);
    res.status(500).json({ message: 'Failed to create assignment' });
  }
});

// Get assignments for teachers (to manage resource allocation)
router.get('/teacher', auth, requireRole(['TEACHER']), async (req, res) => {
  try {
    const teacher = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { organizationId: true }
    });

    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found' });
    }

    const assignments = await prisma.assessment.findMany({
      where: {
        createdBy: { organizationId: teacher.organizationId }
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
        },
        unit: {
          select: {
            id: true,
            name: true,
            order: true
          }
        },
        resources: {
          select: {
            id: true,
            title: true,
            description: true,
            type: true,
            fileSize: true,
            createdAt: true
          }
        },
        submissions: {
          select: {
            id: true,
            score: true,
            submittedAt: true,
            attempts: true,
            student: {
              select: {
                id: true,
                firstName: true,
                lastName: true
              }
            }
          }
        }
      },
      orderBy: [
        { course: { name: 'asc' } },
        { unit: { order: 'asc' } },
        { createdAt: 'asc' }
      ]
    });

    res.json({ assignments });
  } catch (error) {
    console.error('Error fetching teacher assignments:', error);
    res.status(500).json({ message: 'Failed to fetch assignments' });
  }
});

// Update an assignment
router.patch('/:assignmentId', auth, requireRole(['TEACHER']), [
  body('title').optional().notEmpty().withMessage('Assignment title cannot be empty'),
  body('description').optional(),
  body('type').optional().isIn(['multiple-choice', 'true-false', 'matching', 'drag-and-drop', 'writing', 'writing-long', 'speaking', 'assignment', 'listening']).withMessage('Valid assessment type is required'),
  body('category').optional(),
  body('criteria').optional(),
  body('questions').optional(),
  body('dueDate').optional().isISO8601().withMessage('Due date must be a valid date'),
  body('quarter').optional().isIn(['Q1', 'Q2', 'Q3', 'Q4']).withMessage('Quarter must be Q1, Q2, Q3, or Q4'),
  body('maxAttempts').optional().isInt({ min: 1 }).withMessage('Max attempts must be a positive integer'),
  body('courseId').optional(),
  body('unitId').optional(),
  body('partId').optional(),
  body('sectionId').optional(),
  body('topicId').optional(),
  body('published').optional().isBoolean().withMessage('Published must be a boolean')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { assignmentId } = req.params;
    const updateData = req.body;

    // Verify the teacher exists and get their organization
    const teacher = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { organizationId: true }
    });

    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found' });
    }

    // Verify the assignment exists and belongs to the teacher's organization
    const existingAssignment = await prisma.assessment.findFirst({
      where: {
        id: assignmentId,
        createdBy: { organizationId: teacher.organizationId }
      }
    });

    if (!existingAssignment) {
      return res.status(404).json({ message: 'Assignment not found or not accessible' });
    }

    // If courseId is being updated, verify it belongs to the teacher's organization
    if (updateData.courseId) {
      const course = await prisma.course.findFirst({
        where: {
          id: updateData.courseId,
          subject: {
            organizationId: teacher.organizationId
          }
        }
      });

      if (!course) {
        return res.status(404).json({ message: 'Course not found or not accessible' });
      }
    }

    // If unitId is being updated, verify it belongs to the teacher's organization
    if (updateData.unitId) {
      const unit = await prisma.unit.findFirst({
        where: {
          id: updateData.unitId,
          course: {
            subject: {
              organizationId: teacher.organizationId
            }
          }
        }
      });

      if (!unit) {
        return res.status(404).json({ message: 'Unit not found or not accessible' });
      }
    }

    // Convert dueDate to Date object if provided
    if (updateData.dueDate) {
      updateData.dueDate = new Date(updateData.dueDate);
    }

    // Update the assignment
    const updatedAssignment = await prisma.assessment.update({
      where: { id: assignmentId },
      data: updateData,
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
        },
        unit: {
          select: {
            id: true,
            name: true,
            order: true
          }
        },
        resources: {
          select: {
            id: true,
            title: true,
            description: true,
            type: true,
            fileSize: true,
            createdAt: true
          }
        }
      }
    });

    res.json({ 
      message: 'Assignment updated successfully', 
      assignment: updatedAssignment 
    });
  } catch (error) {
    console.error('Error updating assignment:', error);
    res.status(500).json({ message: 'Failed to update assignment' });
  }
});

// Delete an assignment
router.delete('/:assignmentId', auth, requireRole(['TEACHER']), async (req, res) => {
  try {
    const { assignmentId } = req.params;

    // Verify the teacher exists and get their organization
    const teacher = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { organizationId: true }
    });

    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found' });
    }

    // Verify the assignment exists and belongs to the teacher's organization
    const assignment = await prisma.assessment.findFirst({
      where: {
        id: assignmentId,
        createdBy: { organizationId: teacher.organizationId }
      }
    });

    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found or not accessible' });
    }

    // Delete the assignment (this will cascade delete related records)
    await prisma.assessment.delete({
      where: { id: assignmentId }
    });

    res.json({ message: 'Assignment deleted successfully' });
  } catch (error) {
    console.error('Error deleting assignment:', error);
    res.status(500).json({ message: 'Failed to delete assignment' });
  }
});

// Allocate resources to an assignment
router.post('/resources', auth, requireRole(['TEACHER']), [
  body('assignmentId').notEmpty().withMessage('Assignment ID is required'),
  body('resourceIds').isArray().withMessage('Resource IDs must be an array')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { assignmentId, resourceIds } = req.body;

    const teacher = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { organizationId: true }
    });

    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found' });
    }

    // Verify assignment belongs to teacher's organization
    const assignment = await prisma.assessment.findFirst({
      where: {
        id: assignmentId,
        createdBy: { organizationId: teacher.organizationId }
      }
    });

    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    // Verify all resources belong to teacher's organization
    const resources = await prisma.resource.findMany({
      where: {
        id: { in: resourceIds },
        createdBy: { organizationId: teacher.organizationId }
      }
    });

    if (resources.length !== resourceIds.length) {
      return res.status(400).json({ message: 'Some resources not found or not accessible' });
    }

    // Update assignment to include the resources
    await prisma.assessment.update({
      where: { id: assignmentId },
      data: {
        resources: {
          connect: resourceIds.map(id => ({ id }))
        }
      }
    });

    res.json({ message: 'Resources allocated successfully' });
  } catch (error) {
    console.error('Error allocating resources:', error);
    res.status(500).json({ message: 'Failed to allocate resources' });
  }
});

// Remove a resource from an assignment
router.delete('/:assignmentId/resources/:resourceId', auth, requireRole(['TEACHER']), async (req, res) => {
  try {
    const { assignmentId, resourceId } = req.params;

    const teacher = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { organizationId: true }
    });

    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found' });
    }

    // Verify assignment belongs to teacher's organization
    const assignment = await prisma.assessment.findFirst({
      where: {
        id: assignmentId,
        createdBy: { organizationId: teacher.organizationId }
      }
    });

    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    // Remove the resource from the assignment
    await prisma.assessment.update({
      where: { id: assignmentId },
      data: {
        resources: {
          disconnect: { id: resourceId }
        }
      }
    });

    res.json({ message: 'Resource removed from assignment' });
  } catch (error) {
    console.error('Error removing resource from assignment:', error);
    res.status(500).json({ message: 'Failed to remove resource' });
  }
});

// Get assignment details with resources and progress
router.get('/:assignmentId', auth, requireRole(['STUDENT', 'TEACHER']), async (req, res) => {
  try {
    const { assignmentId } = req.params;

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { 
        organizationId: true,
        role: true,
        studentCourses: {
          select: { courseId: true }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    let whereClause = {
      id: assignmentId,
      course: {
        organizationId: user.organizationId
      }
    };

    // For students, ensure they're enrolled in the course
    if (user.role === 'STUDENT') {
      const enrolledCourseIds = user.studentCourses.map(sc => sc.courseId);
      whereClause.courseId = { in: enrolledCourseIds };
    }

    const assignment = await prisma.assessment.findFirst({
      where: whereClause,
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
        },
        unit: {
          select: {
            id: true,
            name: true,
            order: true
          }
        },
        resources: {
          select: {
            id: true,
            title: true,
            description: true,
            type: true,
            fileSize: true,
            createdAt: true
          }
        },
        submissions: user.role === 'STUDENT' ? {
          where: { studentId: req.user.userId },
          select: {
            id: true,
            score: true,
            submittedAt: true,
            attempts: true
          }
        } : false
      }
    });

    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    res.json({ assignment });
  } catch (error) {
    console.error('Error fetching assignment details:', error);
    res.status(500).json({ message: 'Failed to fetch assignment details' });
  }
});

module.exports = router; 