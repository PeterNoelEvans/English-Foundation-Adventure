const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { body, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const requireRole = auth.requireRole;

const prisma = new PrismaClient();

// Create a new course (teacher only)
router.post(
  '/',
  auth,
  requireRole(['TEACHER']),
  [
    body('name').notEmpty().withMessage('Course name is required'),
    body('subjectId').notEmpty().withMessage('Subject ID is required'),
    body('description').optional()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      
      const { name, subjectId, description } = req.body;
      
      // Verify the subject exists and belongs to the teacher's organization
      const subject = await prisma.subject.findFirst({
        where: {
          id: subjectId,
          organizationId: req.user.organizationId
        }
      });
      
      if (!subject) {
        return res.status(404).json({ message: 'Subject not found' });
      }
      
      // Check if course already exists for this subject
      const existingCourse = await prisma.course.findFirst({
        where: { 
          subjectId: subjectId,
          name: name
        }
      });
      
      if (existingCourse) {
        return res.status(400).json({ message: 'Course with this name already exists for this subject' });
      }
      
      const course = await prisma.course.create({
        data: {
          name,
          description,
          subjectId,
          createdById: req.user.userId
        },
        include: {
          subject: {
            select: {
              id: true,
              name: true
            }
          },
          createdBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true
            }
          },
          units: {
            include: {
              parts: {
                include: {
                  sections: true
                }
              }
            }
          },
          topics: true
        }
      });
      
      res.status(201).json({ message: 'Course created successfully', course });
    } catch (error) {
      console.error('Create course error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// List all courses for the user's organization
router.get('/', auth, requireRole(['TEACHER']), async (req, res) => {
  try {
    const { subjectId } = req.query;
    const where = {
      subject: {
        organizationId: req.user.organizationId
      }
    };
    
    if (subjectId) where.subjectId = subjectId;
    
    const courses = await prisma.course.findMany({
      where,
      include: {
        subject: {
          select: {
            id: true,
            name: true
          }
        },
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        },
        units: {
          include: {
            parts: {
              include: {
                sections: true
              }
            }
          }
        },
        topics: true
      },
      orderBy: [
        { subject: { name: 'asc' } },
        { name: 'asc' }
      ]
    });
    
    res.json({ courses });
  } catch (error) {
    console.error('List courses error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get a specific course by ID
router.get('/:id', auth, requireRole(['TEACHER']), async (req, res) => {
  try {
    const { id } = req.params;
    
    const course = await prisma.course.findFirst({
      where: { 
        id,
        subject: {
          organizationId: req.user.organizationId
        }
      },
      include: {
        subject: {
          select: {
            id: true,
            name: true
          }
        },
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        },
        units: {
          include: {
            parts: {
              include: {
                sections: true
              }
            }
          }
        },
        topics: true
      }
    });
    
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    res.json({ course });
  } catch (error) {
    console.error('Get course error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update a course (teacher only)
router.patch(
  '/:id',
  auth,
  requireRole(['TEACHER']),
  [
    body('name').optional().notEmpty().withMessage('Course name cannot be empty'),
    body('subjectId').optional().notEmpty().withMessage('Subject ID cannot be empty'),
    body('description').optional()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      
      const { id } = req.params;
      const { name, subjectId, description } = req.body;
      
      // Check if course exists and belongs to teacher's organization
      const existingCourse = await prisma.course.findFirst({
        where: {
          id,
          subject: {
            organizationId: req.user.organizationId
          }
        },
        include: {
          subject: {
            select: {
              id: true,
              name: true
            }
          }
        }
      });
      
      if (!existingCourse) {
        return res.status(404).json({ message: 'Course not found' });
      }
      
      // If subjectId is being changed, verify the new subject exists
      if (subjectId && subjectId !== existingCourse.subjectId) {
        const newSubject = await prisma.subject.findFirst({
          where: {
            id: subjectId,
            organizationId: req.user.organizationId
          }
        });
        
        if (!newSubject) {
          return res.status(404).json({ message: 'Subject not found' });
        }
      }
      
      // Check for duplicate course if subjectId is being changed
      if (subjectId && subjectId !== existingCourse.subjectId) {
        const duplicateCourse = await prisma.course.findFirst({
          where: {
            subjectId: subjectId,
            name: name || existingCourse.name,
            id: { not: id }
          }
        });
        
        if (duplicateCourse) {
          return res.status(400).json({ message: 'Course with this name already exists for this subject' });
        }
      }
      
      const updateData = {};
      if (name) updateData.name = name;
      if (subjectId) updateData.subjectId = subjectId;
      if (description !== undefined) updateData.description = description;
      
      const updatedCourse = await prisma.course.update({
        where: { id },
        data: updateData,
        include: {
          subject: {
            select: {
              id: true,
              name: true
            }
          },
          createdBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true
            }
          },
          units: {
            include: {
              parts: {
                include: {
                  sections: true
                }
              }
            }
          },
          topics: true
        }
      });
      
      res.json({ message: 'Course updated successfully', course: updatedCourse });
    } catch (error) {
      console.error('Update course error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// Delete a course (teacher only)
router.delete('/:id', auth, requireRole(['TEACHER']), async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if course exists and belongs to teacher's organization
    const course = await prisma.course.findFirst({
      where: {
        id,
        subject: {
          organizationId: req.user.organizationId
        }
      },
      include: {
        units: {
          include: {
            parts: {
              include: {
                sections: true
              }
            }
          }
        }
      }
    });
    
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    // Check if course has units
    if (course.units && course.units.length > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete course that contains units. Please remove all units first.' 
      });
    }
    
    // Delete the course
    await prisma.course.delete({
      where: { id }
    });
    
    res.json({ message: 'Course deleted successfully' });
  } catch (error) {
    console.error('Delete course error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 