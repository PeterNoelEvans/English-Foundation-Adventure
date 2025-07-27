const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { body, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const requireRole = auth.requireRole;
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const prisma = new PrismaClient();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB limit
  },
  fileFilter: function (req, file, cb) {
    const allowedTypes = [
      // Audio
      'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4', 'audio/aac',
      // Video
      'video/mp4', 'video/webm', 'video/ogg', 'video/avi', 'video/mov',
      // PDF
      'application/pdf',
      // Images
      'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only audio, video, PDF, and image files are allowed.'), false);
    }
  }
});

// Helper function to get subject ID from course ID
async function getSubjectIdFromCourse(courseId) {
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: { subjectId: true }
  });
  return course?.subjectId;
}

// Helper function to determine resource type from MIME type
function getResourceType(mimeType) {
  if (mimeType.startsWith('audio/')) return 'AUDIO';
  if (mimeType.startsWith('video/')) return 'VIDEO';
  if (mimeType === 'application/pdf') return 'PDF';
  if (mimeType.startsWith('image/')) return 'IMAGE';
  return 'OTHER';
}

// Create a new resource (with file upload)
router.post(
  '/',
  auth,
  requireRole(['TEACHER']),
  upload.single('file'),
  [
    body('title').notEmpty().withMessage('Title is required'),
    body('description').optional(),
    body('courseId').optional(),
    body('unitId').optional(),
    body('tags').optional().isString().withMessage('Tags must be a string'),
    body('isPublic').optional().isString().withMessage('isPublic must be a string'),
    body('isShared').optional().isString().withMessage('isShared must be a string')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      if (!req.file) {
        return res.status(400).json({ message: 'File is required' });
      }

      const { title, description, courseId, unitId, tags, isPublic, isShared } = req.body;
      
      // Get teacher's organization ID
      const teacher = await prisma.user.findUnique({
        where: { id: req.user.userId },
        select: { organizationId: true }
      });

      if (!teacher) {
        return res.status(404).json({ message: 'Teacher not found' });
      }

      // Validate course and unit belong to teacher's organization (only if not shared)
      if (!isShared || isShared === 'false') {
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
            return res.status(404).json({ message: 'Course not found' });
          }
        }

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
            return res.status(404).json({ message: 'Unit not found' });
          }
        }
      }

      const resourceType = getResourceType(req.file.mimetype);
      const parsedTags = tags ? JSON.parse(tags) : [];

      const resource = await prisma.resource.create({
        data: {
          title,
          description,
          type: resourceType,
          filePath: req.file.path,
          fileSize: req.file.size,
          mimeType: req.file.mimetype,
          isShared: isShared === 'true' || isShared === true,
          isPublic: isPublic === 'true' || isPublic === true,
          tags: parsedTags,
          subjectId: isShared === 'true' || isShared === true ? null : (courseId ? await getSubjectIdFromCourse(courseId) : null),
          courseId: isShared === 'true' || isShared === true ? null : courseId,
          unitId: isShared === 'true' || isShared === true ? null : unitId,
          createdById: req.user.userId
        },
        include: {
          subject: {
            select: {
              id: true,
              name: true
            }
          },
          course: {
            select: {
              id: true,
              name: true
            }
          },
          unit: {
            select: {
              id: true,
              name: true,
              order: true
            }
          }
        }
      });

      res.status(201).json({ 
        message: 'Resource created successfully', 
        resource: {
          ...resource,
          filePath: `/uploads/${path.basename(resource.filePath)}` // Return relative path for frontend
        }
      });
    } catch (error) {
      console.error('Resource creation error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// Get shared resources (templates)
router.get('/shared', auth, requireRole(['TEACHER']), async (req, res) => {
  try {
    const { type } = req.query;
    const where = { isShared: true };

    if (type) where.type = type;

    const sharedResources = await prisma.resource.findMany({
      where,
      include: {
        createdBy: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Add relative file paths for frontend
    const resourcesWithPaths = sharedResources.map(resource => ({
      ...resource,
      filePath: `/uploads/${path.basename(resource.filePath)}`
    }));

    res.json({ resources: resourcesWithPaths });
  } catch (error) {
    console.error('Get shared resources error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all resources for the teacher's organization
router.get('/', auth, requireRole(['TEACHER']), async (req, res) => {
  try {
    const { courseId, unitId, partId, sectionId, topicId, type } = req.query;
    const where = { 
      createdBy: {
        organizationId: req.user.organizationId
      }
    };

    if (courseId) where.courseId = courseId;
    if (unitId) where.unitId = unitId;
    if (partId) where.partId = partId;
    if (sectionId) where.sectionId = sectionId;
    if (topicId) where.topicId = topicId;
    if (type) where.type = type;

    const resources = await prisma.resource.findMany({
      where,
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
        part: {
          select: {
            id: true,
            name: true
          }
        },
        section: {
          select: {
            id: true,
            name: true
          }
        },
        topic: {
          select: {
            id: true,
            name: true
          }
        },
        createdBy: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Add relative file paths for frontend
    const resourcesWithPaths = resources.map(resource => ({
      ...resource,
      filePath: resource.filePath ? `/uploads/${path.basename(resource.filePath)}` : null
    }));

    res.json({ resources: resourcesWithPaths });
  } catch (error) {
    console.error('Get resources error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get a specific resource
router.get('/:id', auth, requireRole(['TEACHER']), async (req, res) => {
  try {
    const { id } = req.params;

    const resource = await prisma.resource.findFirst({
      where: { 
        id,
        createdBy: {
          organizationId: req.user.organizationId
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
            name: true
          }
        },
        part: {
          select: {
            id: true,
            name: true
          }
        },
        section: {
          select: {
            id: true,
            name: true
          }
        },
        topic: {
          select: {
            id: true,
            name: true
          }
        },
        createdBy: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      }
    });

    if (!resource) {
      return res.status(404).json({ message: 'Resource not found' });
    }

    res.json({ 
      resource: {
        ...resource,
        filePath: resource.filePath ? `/uploads/${path.basename(resource.filePath)}` : null
      }
    });
  } catch (error) {
    console.error('Get resource error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update a resource
router.patch('/:id', auth, requireRole(['TEACHER']), [
  body('title').optional().notEmpty().withMessage('Title cannot be empty'),
  body('description').optional(),
  body('courseId').optional(),
  body('unitId').optional(),
  body('tags').optional().isArray().withMessage('Tags must be an array'),
  body('isPublic').optional().isBoolean().withMessage('isPublic must be a boolean')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { title, description, courseId, unitId, tags, isPublic } = req.body;

    const teacher = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { schoolId: true }
    });

    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found' });
    }

    // Check if resource exists and belongs to teacher's school
    const existingResource = await prisma.resource.findFirst({
      where: { 
        id,
        schoolId: teacher.schoolId,
        createdById: req.user.userId // Only allow updating own resources
      }
    });

    if (!existingResource) {
      return res.status(404).json({ message: 'Resource not found' });
    }

    const updateData = {};
    if (title) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (courseId !== undefined) updateData.courseId = courseId;
    if (unitId !== undefined) updateData.unitId = unitId;
    if (tags) updateData.tags = JSON.parse(tags);
    if (isPublic !== undefined) updateData.isPublic = isPublic === 'true' || isPublic === true;

    const resource = await prisma.resource.update({
      where: { id },
      data: updateData,
      include: {
        course: true,
        unit: true
      }
    });

    res.json({ 
      message: 'Resource updated successfully', 
      resource: {
        ...resource,
        filePath: `/uploads/${path.basename(resource.filePath)}`
      }
    });
  } catch (error) {
    console.error('Update resource error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Allocate a shared resource to a course
router.post('/allocate', auth, requireRole(['TEACHER']), [
  body('resourceId').notEmpty().withMessage('Resource ID is required'),
  body('courseId').notEmpty().withMessage('Course ID is required'),
  body('unitId').optional()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { resourceId, courseId, unitId } = req.body;

    const teacher = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { schoolId: true }
    });

    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found' });
    }

    // Get the shared resource template
    const templateResource = await prisma.resource.findFirst({
      where: { 
        id: resourceId,
        isShared: true
      }
    });

    if (!templateResource) {
      return res.status(404).json({ message: 'Shared resource template not found' });
    }

    // Validate course belongs to teacher's school
    const course = await prisma.course.findFirst({
      where: { id: courseId, schoolId: teacher.schoolId }
    });

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Validate unit if provided
    if (unitId) {
      const unit = await prisma.unit.findFirst({
        where: { id: unitId, schoolId: teacher.schoolId, courseId }
      });
      if (!unit) {
        return res.status(404).json({ message: 'Unit not found' });
      }
    }

    // Create a copy of the resource for the course
    const allocatedResource = await prisma.resource.create({
      data: {
        title: templateResource.title,
        description: templateResource.description,
        type: templateResource.type,
        fileName: templateResource.fileName,
        filePath: templateResource.filePath, // Same file, just different reference
        fileSize: templateResource.fileSize,
        mimeType: templateResource.mimeType,
        duration: templateResource.duration,
        thumbnail: templateResource.thumbnail,
        isShared: false,
        isPublic: templateResource.isPublic,
        tags: templateResource.tags,
        templateId: templateResource.id,
        courseId,
        unitId,
        schoolId: teacher.schoolId,
        createdById: req.user.userId
      },
      include: {
        course: true,
        unit: true,
        template: true
      }
    });

    res.status(201).json({ 
      message: 'Resource allocated successfully', 
      resource: {
        ...allocatedResource,
        filePath: `/uploads/${path.basename(allocatedResource.filePath)}`
      }
    });
  } catch (error) {
    console.error('Resource allocation error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete a resource
router.delete('/:id', auth, requireRole(['TEACHER']), async (req, res) => {
  try {
    const { id } = req.params;

    const teacher = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { organizationId: true }
    });

    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found' });
    }

    // Check if resource exists and belongs to teacher's organization
    const resource = await prisma.resource.findFirst({
      where: { 
        id,
        createdBy: {
          organizationId: teacher.organizationId
        },
        createdById: req.user.userId // Only allow deleting own resources
      }
    });

    if (!resource) {
      return res.status(404).json({ message: 'Resource not found' });
    }

    // Only delete the file if this is not a copy of a shared resource
    if (!resource.templateId) {
      try {
        if (fs.existsSync(resource.filePath)) {
          fs.unlinkSync(resource.filePath);
        }
      } catch (fileError) {
        console.error('Error deleting file:', fileError);
      }
    }

    await prisma.resource.delete({
      where: { id }
    });

    res.json({ message: 'Resource deleted successfully' });
  } catch (error) {
    console.error('Delete resource error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 