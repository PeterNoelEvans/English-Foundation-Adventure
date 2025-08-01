const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { body, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const requireRole = auth.requireRole;

const prisma = new PrismaClient();

// Create a new unit (teacher only)
router.post(
  '/',
  auth,
  requireRole(['TEACHER']),
  [
    body('title').notEmpty().withMessage('Unit title is required'),
    body('number').isInt({ min: 1 }).withMessage('Unit number must be a positive integer'),
    body('description').optional(),
    body('courseId').optional()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      
      const { title, number, description, courseId } = req.body;
      
      // If courseId is provided, verify it exists and belongs to the teacher's organization
      if (courseId) {
        const course = await prisma.course.findFirst({
          where: {
            id: courseId,
            subject: {
              organizationId: req.user.organizationId
            }
          }
        });
        
        if (!course) {
          return res.status(404).json({ message: 'Course not found' });
        }
      }
      
      // Check for duplicate unit number in the same course (if courseId provided)
      if (courseId) {
        const existingUnit = await prisma.unit.findFirst({
          where: {
            courseId,
            order: number
          }
        });
        
        if (existingUnit) {
          return res.status(400).json({ message: `Unit number ${number} already exists in this course` });
        }
      }
      
      const unit = await prisma.unit.create({
        data: {
          name: title,
          description: description || '',
          order: number,
          courseId: courseId || null
        },
        include: {
          course: {
            select: {
              id: true,
              name: true,
              yearLevel: true,
              subject: {
                select: {
                  id: true,
                  name: true
                }
              }
            }
          },
          parts: {
            include: {
              sections: true
            }
          }
        }
      });
      
      // Transform unit to match frontend expectations
      const transformedUnit = {
        ...unit,
        title: unit.name,
        number: unit.order
      };
      
      res.status(201).json({ message: 'Unit created successfully', unit: transformedUnit });
    } catch (error) {
      console.error('Create unit error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// List all units for the user's organization
router.get('/', auth, requireRole(['TEACHER']), async (req, res) => {
  try {
    const units = await prisma.unit.findMany({
      where: {
        course: {
          subject: {
            organizationId: req.user.organizationId
          }
        }
      },
      include: {
        course: {
          select: {
            id: true,
            name: true,
            yearLevel: true,
            subject: {
              select: {
                id: true,
                name: true
              }
            }
          }
        },
        parts: {
          include: {
            sections: true
          }
        }
      },
      orderBy: [
        { course: { subject: { name: 'asc' } } },
        { course: { yearLevel: 'asc' } },
        { order: 'asc' }
      ]
    });
    
    // Transform units to match frontend expectations
    const transformedUnits = units.map(unit => ({
      ...unit,
      title: unit.name,
      number: unit.order
    }));
    
    res.json({ units: transformedUnits });
  } catch (error) {
    console.error('List units error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get units for a specific course
router.get('/course/:courseId', auth, requireRole(['TEACHER']), async (req, res) => {
  try {
    const { courseId } = req.params;
    
    // Verify the course belongs to the user's organization
    const course = await prisma.course.findFirst({
      where: {
        id: courseId,
        subject: {
          organizationId: req.user.organizationId
        }
      }
    });
    
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    const units = await prisma.unit.findMany({
      where: {
        courseId: courseId
      },
      include: {
        parts: {
          include: {
            sections: true
          }
        }
      },
      orderBy: { order: 'asc' }
    });
    
    // Transform units to match frontend expectations
    const transformedUnits = units.map(unit => ({
      ...unit,
      title: unit.name,
      number: unit.order
    }));
    
    res.json({ units: transformedUnits });
  } catch (error) {
    console.error('Get course units error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Simple test endpoint
router.get('/test', (req, res) => {
  res.json({ message: 'Units route is working' });
});

// Debug endpoint to check units in database
router.get('/debug/course/:courseId', auth, requireRole(['TEACHER']), async (req, res) => {
  try {
    const { courseId } = req.params;
    
    console.log('Debug endpoint called for courseId:', courseId);
    console.log('User organizationId:', req.user.organizationId);
    
    // Get the course with units
    const course = await prisma.course.findFirst({
      where: {
        id: courseId,
        subject: {
          organizationId: req.user.organizationId
        }
      },
      include: {
        units: {
          orderBy: { order: 'asc' }
        }
      }
    });
    
    console.log('Course found:', course ? 'Yes' : 'No');
    if (course) {
      console.log('Course units count:', course.units.length);
      console.log('Course units:', course.units.map(u => ({ id: u.id, name: u.name, order: u.order })));
    }
    
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    res.json({
      course: {
        id: course.id,
        name: course.name,
        unitsCount: course.units.length,
        units: course.units.map(u => ({
          id: u.id,
          name: u.name,
          order: u.order,
          description: u.description
        }))
      }
    });
  } catch (error) {
    console.error('Debug units error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Bulk import units (teacher only)
router.post(
  '/bulk',
  auth,
  requireRole(['TEACHER']),
  [
    body('units').isArray().withMessage('Units must be an array'),
    body('units.*.title').notEmpty().withMessage('Unit title is required'),
    body('units.*.number').isInt({ min: 1 }).withMessage('Unit number must be a positive integer'),
    body('units.*.description').optional(),
    body('courseId').notEmpty().withMessage('Course ID is required')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      
      const { units, courseId } = req.body;
      
      // Verify the course exists and belongs to the teacher's organization
      const course = await prisma.course.findFirst({
        where: {
          id: courseId,
          subject: {
            organizationId: req.user.organizationId
          }
        }
      });
      
      if (!course) {
        return res.status(404).json({ message: 'Course not found' });
      }
      
      // Check for duplicate unit numbers
      const existingUnits = await prisma.unit.findMany({
        where: { courseId },
        select: { order: true }
      });
      
      const existingOrders = existingUnits.map(u => u.order);
      const newOrders = units.map(u => u.number);
      const duplicates = newOrders.filter(order => existingOrders.includes(order));
      
      if (duplicates.length > 0) {
        return res.status(400).json({ 
          message: `Unit numbers already exist: ${duplicates.join(', ')}` 
        });
      }
      
      // Create all units
      const createdUnits = [];
      const results = [];
      
      console.log('Starting bulk import for courseId:', courseId);
      console.log('Units to import:', units);
      
      for (let i = 0; i < units.length; i++) {
        const unit = units[i];
        console.log(`Creating unit ${i + 1}/${units.length}:`, unit);
        try {
          const createdUnit = await prisma.unit.create({
            data: {
              name: unit.title,
              description: unit.description || '',
              order: unit.number,
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
          
          console.log(`Successfully created unit ${i + 1}:`, createdUnit.id);
          
          // Transform unit to match frontend expectations
          const transformedUnit = {
            ...createdUnit,
            title: createdUnit.name,
            number: createdUnit.order
          };
          
          createdUnits.push(transformedUnit);
          results.push({
            status: 'success',
            index: i,
            unit: transformedUnit
          });
        } catch (error) {
          results.push({
            status: 'error',
            index: i,
            error: error.message
          });
        }
      }
      
      console.log('Bulk import completed. Created units:', createdUnits.length);
      console.log('Results:', results);
      
      res.status(201).json({ 
        message: 'Bulk import completed', 
        results,
        createdUnits 
      });
    } catch (error) {
      console.error('Bulk import units error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// Update a unit (teacher only)
router.patch(
  '/:id',
  auth,
  requireRole(['TEACHER']),
  [
    body('title').optional().notEmpty().withMessage('Unit title cannot be empty'),
    body('number').optional().isInt({ min: 1 }).withMessage('Unit number must be a positive integer'),
    body('description').optional(),
    body('courseId').optional()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      
      const { id } = req.params;
      const { title, number, description, courseId } = req.body;
      
      // Check if unit exists and belongs to teacher's organization
      const existingUnit = await prisma.unit.findFirst({
        where: {
          id,
          course: {
            subject: {
              organizationId: req.user.organizationId
            }
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
          }
        }
      });
      
      if (!existingUnit) {
        return res.status(404).json({ message: 'Unit not found' });
      }
      
      // If courseId is being changed, verify the new course exists
      if (courseId && courseId !== existingUnit.courseId) {
        const newCourse = await prisma.course.findFirst({
          where: {
            id: courseId,
            subject: {
              organizationId: req.user.organizationId
            }
          }
        });
        
        if (!newCourse) {
          return res.status(404).json({ message: 'Course not found' });
        }
      }
      
      // Check for duplicate unit number if number is being changed
      if (number && number !== existingUnit.order) {
        const duplicateUnit = await prisma.unit.findFirst({
          where: {
            courseId: courseId || existingUnit.courseId,
            order: number,
            id: { not: id }
          }
        });
        
        if (duplicateUnit) {
          return res.status(400).json({ message: `Unit number ${number} already exists in this course` });
        }
      }
      
      const updateData = {};
      if (title) updateData.name = title;
      if (number) updateData.order = number;
      if (description !== undefined) updateData.description = description;
      if (courseId) updateData.courseId = courseId;
      
      const updatedUnit = await prisma.unit.update({
        where: { id },
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
          }
        }
      });
      
      // Transform unit to match frontend expectations
      const transformedUnit = {
        ...updatedUnit,
        title: updatedUnit.name,
        number: updatedUnit.order
      };
      
      res.json({ message: 'Unit updated successfully', unit: transformedUnit });
    } catch (error) {
      console.error('Update unit error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// Delete a unit (teacher only)
router.delete('/:id', auth, requireRole(['TEACHER']), async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if unit exists and belongs to teacher's organization
    const unit = await prisma.unit.findFirst({
      where: {
        id,
        course: {
          subject: {
            organizationId: req.user.organizationId
          }
        }
      },
      include: {
        parts: {
          include: {
            sections: true
          }
        }
      }
    });
    
    if (!unit) {
      return res.status(404).json({ message: 'Unit not found' });
    }
    
    // Check if unit has content (parts, sections, etc.)
    if (unit.parts && unit.parts.length > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete unit that contains content. Please remove all parts and sections first.' 
      });
    }
    
    // Delete the unit
    await prisma.unit.delete({
      where: { id }
    });
    
    res.json({ message: 'Unit deleted successfully' });
  } catch (error) {
    console.error('Delete unit error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 