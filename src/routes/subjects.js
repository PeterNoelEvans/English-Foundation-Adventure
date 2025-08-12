const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { body, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const requireRole = auth.requireRole;

const prisma = new PrismaClient();

// Create a new subject (teacher only)
router.post(
  '/',
  auth,
  requireRole(['TEACHER']),
  [
    body('name').notEmpty().withMessage('Subject name is required'),
    body('description').optional()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { name, description } = req.body;

      console.log('Creating subject for organization:', req.user.organizationId);
      console.log('Subject data:', { name, description });

      // Check if subject already exists in this organization
      const existingSubject = await prisma.subject.findUnique({
        where: { 
          organizationId_name: {
            organizationId: req.user.organizationId,
            name: name
          }
        }
      });

      if (existingSubject) {
        return res.status(400).json({ message: 'Subject with this name already exists' });
      }

      const subject = await prisma.subject.create({
        data: {
          name,
          description,
          organizationId: req.user.organizationId,
          createdById: req.user.userId
        },
        include: {
          organization: true,
          createdBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true
            }
          },
          courses: {
            include: {
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
          }
        }
      });

      res.status(201).json({
        message: 'Subject created successfully',
        subject
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// List all subjects for the user's organization
router.get('/', auth, requireRole(['TEACHER']), async (req, res) => {
  try {
    // Get subjects filtered by user's organization
    const subjects = await prisma.subject.findMany({
      where: {
        organizationId: req.user.organizationId
      },
      include: {
        organization: true,
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        },
        courses: {
          include: {
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
          orderBy: {
            name: 'asc'
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    console.log('Found subjects:', subjects.length);
    console.log('Subjects:', subjects.map(s => ({ id: s.id, name: s.name, organizationId: s.organizationId })));

    res.json({ subjects });
  } catch (error) {
    console.error('List subjects error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Debug endpoint - get all subjects (temporary)
router.get('/debug/all', auth, requireRole(['TEACHER']), async (req, res) => {
  try {
    console.log('Debug: Getting all subjects in database...');
    const allSubjects = await prisma.subject.findMany({
      include: {
        organization: {
          select: { id: true, name: true, code: true }
        }
      }
    });
    
    console.log('All subjects in database:', allSubjects.length);
    console.log('Subjects with orgs:', allSubjects.map(s => ({
      id: s.id,
      name: s.name,
      organizationId: s.organizationId,
      orgName: s.organization?.name
    })));
    
    res.json({ 
      message: 'Debug: All subjects in database',
      allSubjects,
      userOrgId: req.user.organizationId
    });
  } catch (error) {
    console.error('Debug subjects error:', error);
    res.status(500).json({ message: 'Debug error' });
  }
});

// Get a specific subject by ID
router.get('/:id', auth, requireRole(['TEACHER']), async (req, res) => {
  try {
    const { id } = req.params;

    const subject = await prisma.subject.findUnique({
      where: { 
        id,
        organizationId: req.user.organizationId // Ensure user can only access subjects from their organization
      },
      include: {
        organization: true,
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        },
        courses: {
          include: {
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
          orderBy: {
            name: 'asc'
          }
        }
      }
    });

    if (!subject) {
      return res.status(404).json({ message: 'Subject not found' });
    }

    res.json({ subject });
  } catch (error) {
    console.error('Get subject error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update a subject (teacher only)
router.patch(
  '/:id',
  auth,
  requireRole(['TEACHER']),
  [
    body('name').optional().notEmpty().withMessage('Subject name cannot be empty'),
    body('description').optional()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const { name, description } = req.body;

      // Check if subject exists and belongs to teacher's organization
      const existingSubject = await prisma.subject.findFirst({
        where: {
          id,
          organizationId: req.user.organizationId
        }
      });

      if (!existingSubject) {
        return res.status(404).json({ message: 'Subject not found' });
      }

      // Check for duplicate subject name if name is being changed
      if (name && name !== existingSubject.name) {
        const duplicateSubject = await prisma.subject.findUnique({
          where: { 
            organizationId_name: {
              organizationId: req.user.organizationId,
              name: name
            }
          }
        });

        if (duplicateSubject) {
          return res.status(400).json({ message: 'Subject with this name already exists' });
        }
      }

      const updateData = {};
      if (name) updateData.name = name;
      if (description !== undefined) updateData.description = description;

      const updatedSubject = await prisma.subject.update({
        where: { id },
        data: updateData,
        include: {
          organization: true,
          createdBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true
            }
          },
          courses: {
            include: {
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
            orderBy: {
              name: 'asc'
            }
          }
        }
      });

      res.json({
        message: 'Subject updated successfully',
        subject: updatedSubject
      });
    } catch (error) {
      console.error('Update subject error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// Delete a subject (teacher only)
router.delete('/:id', auth, requireRole(['TEACHER']), async (req, res) => {
  try {
    const { id } = req.params;

    // Check if subject exists and belongs to teacher's organization
    const subject = await prisma.subject.findFirst({
      where: {
        id,
        organizationId: req.user.organizationId
      },
      include: {
        courses: {
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
        }
      }
    });

    if (!subject) {
      return res.status(404).json({ message: 'Subject not found' });
    }

    // Check if subject has courses
    if (subject.courses && subject.courses.length > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete subject that contains courses. Please remove all courses first.' 
      });
    }

    // Delete the subject
    await prisma.subject.delete({
      where: { id }
    });

    res.json({ message: 'Subject deleted successfully' });
  } catch (error) {
    console.error('Delete subject error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 