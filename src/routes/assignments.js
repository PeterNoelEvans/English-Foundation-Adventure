const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { body, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const requireRole = auth.requireRole;
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const router = express.Router();
const prisma = new PrismaClient();

// Storage for student evidence uploads
const evidenceStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const studentId = req.user.userId;
    const assignmentId = req.params.assignmentId;
    const orgId = req.user.organizationId || 'common';
    const year = new Date().getFullYear().toString();
    const dir = path.join(__dirname, '../../uploads/assignment-submissions', orgId, studentId, assignmentId, year);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'evidence-' + unique + path.extname(file.originalname));
  }
});
const evidenceUpload = multer({
  storage: evidenceStorage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB per file
  fileFilter: function (req, file, cb) {
    const ok = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (ok.includes(file.mimetype)) return cb(null, true);
    cb(new Error('Only image uploads are allowed for this assignment type'));
  }
});

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
          subject: {
            organizationId: student.organizationId
          }
        },
        // Filter by availability dates
        OR: [
          {
            availableFrom: null,
            availableTo: null
          },
          {
            availableFrom: {
              lte: new Date()
            },
            availableTo: null
          },
          {
            availableFrom: null,
            availableTo: {
              gte: new Date()
            }
          },
          {
            availableFrom: {
              lte: new Date()
            },
            availableTo: {
              gte: new Date()
            }
          }
        ]
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
            attempt: true
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
  body('type').isIn(['multiple-choice', 'true-false', 'matching', 'drag-and-drop', 'writing', 'writing-long', 'speaking', 'assignment', 'listening', 'line-match', 'phoneme-build', 'image-upload']).withMessage('Valid assessment type is required'),
  body('subtype').optional().custom((value, { req }) => {
    // Only validate subtype if type is drag-and-drop
    if (req.body.type === 'drag-and-drop') {
      const validSubtypes = ['ordering', 'categorization', 'fill-blank', 'labeling', 'image-caption'];
      if (!value || !validSubtypes.includes(value)) {
        throw new Error('Valid subtype is required for drag-and-drop');
      }
    }
    return true;
  }),
  body('category').optional(),
  body('difficulty').optional().isIn(['beginner', 'intermediate', 'advanced']).withMessage('Difficulty must be beginner, intermediate, or advanced'),
  body('timeLimit').optional().isInt({ min: 1 }).withMessage('Time limit must be a positive integer'),
  body('points').optional().isInt({ min: 1 }).withMessage('Points must be a positive integer'),
  body('questions').optional(),
  body('bulkQuestions').optional(),
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
  console.log('=== ASSIGNMENT POST ROUTE START ===');
  console.log('Request method:', req.method);
  console.log('Request URL:', req.url);
  console.log('Request body type:', typeof req.body);
  console.log('Request body keys:', Object.keys(req.body || {}));
  console.log('=== END ROUTE START ===');
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
          console.log('=== VALIDATION ERRORS ===');
    console.log('Validation errors:', JSON.stringify(errors.array(), null, 2));
    console.log('=== REQUEST BODY ===');
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    console.log('=== REQUEST BODY KEYS ===');
    console.log('Request body keys:', Object.keys(req.body));
    console.log('=== END DEBUG ===');
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
      bulkQuestions,
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
      published = true,
      prerequisites = [],
      recommendations = {},
      difficultyLevel = 'beginner',
      learningObjectives = [],
      createdById,
      // Engagement tracking fields
      trackAttempts = true,
      trackConfidence = true,
      trackTimeSpent = true,
      engagementDeadline = 0,
      lateSubmissionPenalty = 0,
      negativeScoreThreshold = 0,
      recommendedCourses = []
    } = req.body;

    // For development, use a default organization ID
    const defaultOrganizationId = 'e8269d19-1f41-4526-be04-2a92d879a24f'; // PBS organization

    // If courseId is provided, verify it exists
    if (courseId) {
      const course = await prisma.course.findUnique({
        where: { id: courseId }
      });

      if (!course) {
        return res.status(404).json({ message: 'Course not found' });
      }
    }

    // If unitId is provided, verify it exists
    if (unitId) {
      const unit = await prisma.unit.findUnique({
        where: { id: unitId }
      });

      if (!unit) {
        return res.status(404).json({ message: 'Unit not found' });
      }
    }

    // Process questions data for JSON storage
    let questionsData = questions;
    if (bulkQuestions) {
      try {
        // First, try to parse as JSON
        const parsed = JSON.parse(bulkQuestions);
        if (Array.isArray(parsed)) {
          questionsData = {
            type: 'bulk-multiple-choice',
            questions: parsed
          };
        } else {
          throw new Error('Not an array');
        }
      } catch (jsonError) {
        // If JSON parsing fails, try pipe-delimited format
        const bulkLines = bulkQuestions.split('\n').filter(line => line.trim());
        const parsedQuestions = bulkLines.map(line => {
          const parts = line.split('|');
          if (parts.length >= 6) {
            return {
              question: parts[0].trim(),
              options: [parts[1], parts[2], parts[3], parts[4]].filter(opt => opt.trim()),
              correctAnswer: parts[5].trim(),
              explanation: parts[6] ? parts[6].trim() : null,
              incorrectExplanations: parts[7] ? JSON.parse(parts[7]) : null
            };
          }
          return null;
        }).filter(q => q !== null);
        
        if (parsedQuestions.length > 0) {
          questionsData = {
            type: 'bulk-multiple-choice',
            questions: parsedQuestions
          };
        }
      }
    } else if (questions) {
      // Ensure questions is properly formatted as JSON
      questionsData = typeof questions === 'string' ? JSON.parse(questions) : questions;
    }

    console.log('About to create assignment at line 274');
    console.log('Assignment data being sent:', JSON.stringify({
      title,
      description,
      type,
      subtype,
      category,
      difficulty,
      timeLimit,
      points,
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
      prerequisites,
      recommendations,
      difficultyLevel,
      learningObjectives,
      trackAttempts,
      trackConfidence,
      trackTimeSpent,
      engagementDeadline,
      lateSubmissionPenalty,
      negativeScoreThreshold,
      recommendedCourses,
              createdById: createdById || req.user.userId, // Use provided ID or authenticated user's ID
      courseId,
      unitId,
      partId,
      sectionId,
      topicId
    }, null, 2));
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
        questions: questionsData,
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
        prerequisites,
        recommendations,
        difficultyLevel,
        learningObjectives,
        // Engagement tracking data
        trackAttempts,
        trackConfidence,
        trackTimeSpent,
        engagementDeadline,
        lateSubmissionPenalty,
        negativeScoreThreshold,
        recommendedCourses,
        createdById: req.user.userId, // Use the authenticated user's ID
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
    console.error('Error creating assignment at line 295:', error);
    console.error('Error stack:', error.stack);
    console.error('Error message:', error.message);
    res.status(500).json({ message: 'Failed to create assignment' });
  }
});

// Student submits evidence images for image-upload assignments
router.post('/:assignmentId/submit-evidence', auth, requireRole(['STUDENT']), evidenceUpload.fields([
  { name: 'images', maxCount: 6 },
  { name: 'supplementaryImages', maxCount: 10 }
]), async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const { slotMeta } = req.body; // optional JSON metadata describing slots
    const assignment = await prisma.assessment.findUnique({ where: { id: assignmentId } });
    if (!assignment) return res.status(404).json({ message: 'Assignment not found' });
    if (assignment.type !== 'image-upload') return res.status(400).json({ message: 'This endpoint is only for image-upload assignments' });

    const images = (req.files && (req.files.images || [])) || [];
    const supplementary = (req.files && (req.files.supplementaryImages || [])) || [];
    if (images.length === 0) return res.status(400).json({ message: 'No images uploaded' });

    // Persist a submission record with file paths
    const files = images.map(f => ({
      filePath: f.path,
      url: `/uploads/${path.relative(path.join(__dirname, '../../uploads'), f.path).replace(/\\+/g, '/')}`,
      mimeType: f.mimetype,
      size: f.size,
      originalName: f.originalname
    }));

    const supplementaryFiles = supplementary.map(f => ({
      filePath: f.path,
      url: `/uploads/${path.relative(path.join(__dirname, '../../uploads'), f.path).replace(/\\+/g, '/')}`,
      mimeType: f.mimetype,
      size: f.size,
      originalName: f.originalname
    }));

    const submission = await prisma.assessmentSubmission.create({
      data: {
        assessmentId: assignmentId,
        studentId: req.user.userId,
        status: 'SUBMITTED',
        submittedAt: new Date(),
        answers: {
          type: 'image-upload',
          files,
          supplementaryFiles,
          slotMeta: slotMeta ? JSON.parse(slotMeta) : null
        }
      }
    });

    return res.status(201).json({ message: 'Evidence submitted', submission });
  } catch (error) {
    console.error('Submit evidence error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get assignments for teachers (to manage resource allocation)
router.get('/teacher', auth, requireRole(['TEACHER']), async (req, res) => {
  try {
    const { subjectId } = req.query;
    
    // Build the where clause
    let whereClause = {
      OR: [
        {
          course: {
            subject: {
              organizationId: req.user.organizationId
            }
          }
        },
        {
          createdById: req.user.userId
        }
      ]
    };
    
    // If subjectId is provided, filter by that subject
    if (subjectId) {
      whereClause = {
        AND: [
          {
            course: {
              subjectId: subjectId
            }
          },
          {
            courseId: {
              not: null
            }
          }
        ]
      };
    }
    
    // Get assignments filtered by teacher's organization OR created by the teacher
    const assignments = await prisma.assessment.findMany({
      where: whereClause,
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        },
        course: {
          include: {
            subject: true
          }
        },
        unit: true,
        resources: true
      },
      orderBy: [
        { createdAt: 'desc' }
      ]
    });

    res.json({ assignments });
  } catch (error) {
    console.error('Error fetching teacher assignments:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      code: error.code
    });
    res.status(500).json({ 
      message: 'Failed to fetch assignments',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Update an assignment
router.patch('/:assignmentId', auth, requireRole(['TEACHER']), [
  body('title').optional().notEmpty().withMessage('Assignment title cannot be empty'),
  body('description').optional(),
  body('type').optional().isIn(['multiple-choice', 'true-false', 'matching', 'drag-and-drop', 'writing', 'writing-long', 'speaking', 'assignment', 'listening', 'line-match', 'phoneme-build']).withMessage('Valid assessment type is required'),
  body('subtype').optional().custom((value, { req }) => {
    // Only validate subtype if type is drag-and-drop
    if (req.body.type === 'drag-and-drop') {
      const validSubtypes = ['ordering', 'categorization', 'fill-blank', 'labeling', 'image-caption'];
      if (!value || !validSubtypes.includes(value)) {
        throw new Error('Valid subtype is required for drag-and-drop');
      }
    }
    return true;
  }),
  body('category').optional(),
  body('criteria').optional(),
  body('questions').optional(),
  body('dueDate').optional().custom((value) => {
    if (value === '' || value === null || value === undefined) return true;
    return require('validator').isISO8601(value) ? true : 'Due date must be a valid date';
  }),
  body('availableFrom').optional().custom((value) => {
    if (value === '' || value === null || value === undefined) return true;
    return require('validator').isISO8601(value) ? true : 'Available from must be a valid date';
  }),
  body('availableTo').optional().custom((value) => {
    if (value === '' || value === null || value === undefined) return true;
    return require('validator').isISO8601(value) ? true : 'Available to must be a valid date';
  }),
  body('quarter').optional().isIn(['Q1', 'Q2', 'Q3', 'Q4']).withMessage('Quarter must be Q1, Q2, Q3, or Q4'),
  body('maxAttempts').optional().isInt({ min: 1 }).withMessage('Max attempts must be a positive integer'),
  body('courseId').optional(),
  body('unitId').optional(),
  body('partId').optional(),
  body('sectionId').optional(),
  body('topicId').optional(),
  body('published').optional().isBoolean().withMessage('Published must be a boolean'),
  // Engagement tracking fields
  body('trackAttempts').optional().isBoolean().withMessage('Track attempts must be a boolean'),
  body('trackConfidence').optional().isBoolean().withMessage('Track confidence must be a boolean'),
  body('trackTimeSpent').optional().isBoolean().withMessage('Track time spent must be a boolean'),
  body('engagementDeadline').optional().isInt({ min: 0 }).withMessage('Engagement deadline must be a non-negative integer'),
  body('lateSubmissionPenalty').optional().isInt({ min: 0, max: 100 }).withMessage('Late submission penalty must be between 0 and 100'),
  body('negativeScoreThreshold').optional().isInt({ min: 0 }).withMessage('Negative score threshold must be a non-negative integer'),
  body('recommendedCourses').optional().isArray().withMessage('Recommended courses must be an array'),
  // Additional fields that might be sent from frontend
  body('difficulty').optional(),
  body('timeLimit').optional(),
  body('points').optional().isInt({ min: 1 }).withMessage('Points must be a positive integer'),
  body('instructions').optional(),
  body('autoGrade').optional().isBoolean().withMessage('Auto grade must be a boolean'),
  body('showFeedback').optional().isBoolean().withMessage('Show feedback must be a boolean'),
  body('shuffleQuestions').optional().isBoolean().withMessage('Shuffle questions must be a boolean'),
  body('allowReview').optional().isBoolean().withMessage('Allow review must be a boolean'),
  body('tags').optional().isArray().withMessage('Tags must be an array'),
  body('partId').optional(),
  body('sectionId').optional(),
  body('topicId').optional(),
  body('difficultyLevel').optional(),
  body('learningObjectives').optional().isArray().withMessage('Learning objectives must be an array'),
  body('prerequisites').optional().isArray().withMessage('Prerequisites must be an array')
], async (req, res) => {
  try {
    console.log('=== BACKEND DEBUGGING ===');
    console.log('PATCH /assignments/:assignmentId - Request body:', JSON.stringify(req.body, null, 2));
    console.log('PATCH /assignments/:assignmentId - Request params:', req.params);
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', JSON.stringify(errors.array(), null, 2));
      return res.status(400).json({ errors: errors.array() });
    }
    
    console.log('Validation passed, proceeding with update...');

    const { assignmentId } = req.params;
    const updateData = req.body;

    // Use the authenticated user's ID
    const defaultUserId = req.user.userId;
    
    // Verify the teacher exists and get their organization
    const teacher = await prisma.user.findUnique({
      where: { id: defaultUserId },
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

    // Convert date fields to Date objects if provided, or null if empty
    if (updateData.dueDate) {
      updateData.dueDate = new Date(updateData.dueDate);
    } else if (updateData.dueDate === '') {
      updateData.dueDate = null;
    }

    if (updateData.availableFrom) {
      updateData.availableFrom = new Date(updateData.availableFrom);
    } else if (updateData.availableFrom === '') {
      updateData.availableFrom = null;
    }

    if (updateData.availableTo) {
      updateData.availableTo = new Date(updateData.availableTo);
    } else if (updateData.availableTo === '') {
      updateData.availableTo = null;
    }

    console.log('About to update database with data:', JSON.stringify(updateData, null, 2));
    
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

    // For development, just verify the assignment exists
    const assignment = await prisma.assessment.findUnique({
      where: { id: assignmentId }
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
            attempt: true
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