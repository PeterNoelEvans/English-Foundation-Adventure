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

// Helper to convert absolute file path under uploads/ to a web path
function toWebUploadsPath(absolutePath) {
  if (!absolutePath) return null;
  const uploadsRoot = path.join(__dirname, '../../uploads');
  const relative = path.relative(uploadsRoot, absolutePath).replace(/\\+/g, '/');
  return `/uploads/${relative}`;
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Store resources by organization and year to avoid large flat directories
    const orgId = (req.user && req.user.organizationId) ? req.user.organizationId : 'common';
    const year = new Date().getFullYear().toString();
    const uploadDir = path.join(__dirname, '../../uploads/resources', orgId, year);
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
      'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
      // Text/Code/Markdown
      'text/plain', 'text/markdown', 'text/html', 'text/css', 'application/json', 'application/javascript', 'text/javascript'
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
  if (mimeType === 'text/markdown') return 'MARKDOWN';
  if (mimeType.startsWith('text/') || mimeType === 'application/json' || mimeType.includes('javascript')) return 'CODE';
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
    body('subjectId').optional(),
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

      const { title, description, subjectId: frontendSubjectId, courseId, unitId, tags, isPublic, isShared, label } = req.body;
      
      console.log('=== RESOURCE CREATION DEBUG ===');
      console.log('Frontend subjectId:', frontendSubjectId);
      console.log('CourseId:', courseId);
      console.log('UnitId:', unitId);
      console.log('IsShared:', isShared);
      
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

      // Determine subjectId - respect frontend choice, fallback to course subject, then default
      let subjectId = null;
      if (isShared === 'true' || isShared === true) {
        subjectId = null;
        console.log('Resource is shared, subjectId set to null');
      } else if (req.body.subjectId && req.body.subjectId.trim() !== '') {
        // Use the subjectId sent from frontend (user's current subject context)
        subjectId = req.body.subjectId;
        console.log('Using frontend subjectId:', subjectId);
      } else if (courseId) {
        // Fallback: get subject from course if no subjectId provided
        subjectId = await getSubjectIdFromCourse(courseId);
        console.log('Using course subjectId (fallback):', subjectId);
      } else {
        // Final fallback: default to Python subject ID
        subjectId = 'b0dab4fe-91b8-4832-a69c-706f46e240e9';
        console.log('Using default Python subjectId:', subjectId);
      }
      
      console.log('Final subjectId decision:', subjectId);

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
          label: label || null,
          subjectId: subjectId,
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
          filePath: toWebUploadsPath(resource.filePath)
        }
      });
    } catch (error) {
      console.error('Resource creation error:', error);
      console.error('Error stack:', error.stack);
      res.status(500).json({ message: 'Server error', details: error.message });
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
      filePath: toWebUploadsPath(resource.filePath)
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
    const { courseId, unitId, partId, sectionId, topicId, type, subjectId, debug } = req.query;
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
    if (subjectId) where.subjectId = subjectId;
    
    // If debug=true, show all resources without subject filtering
    if (debug === 'true') {
      delete where.subjectId;
    }

    console.log('=== RESOURCES DEBUG ===');
    console.log('Query params:', req.query);
    console.log('Where clause:', JSON.stringify(where, null, 2));
    console.log('Debug mode:', debug === 'true' ? 'ON - showing all resources' : 'OFF - filtering by subject');
    
    const resources = await prisma.resource.findMany({
      where,
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

    console.log('=== QUERY RESULTS ===');
    console.log('Total resources found:', resources.length);
    console.log('Resources subjectIds:', resources.map(r => ({ id: r.id, subjectId: r.subjectId, title: r.title })));
    
    // Check if any resources have the expected subjectId
    const expectedSubjectId = 'b0dab4fe-91b8-4832-a69c-706f46e240e9';
    const matchingResources = resources.filter(r => r.subjectId === expectedSubjectId);
    console.log('Resources matching expected subjectId:', matchingResources.length);
    console.log('Expected subjectId:', expectedSubjectId);
    console.log('=== END QUERY RESULTS ===');

    // Add relative file paths for frontend
    const resourcesWithPaths = resources.map(resource => ({
      ...resource,
      filePath: toWebUploadsPath(resource.filePath)
    }));

    // Group resources by explicit label, else fallback to upload time window
    const groupedResources = [];
    const processedIds = new Set();
    
    const labelMap = new Map();
    for (const res of resourcesWithPaths) {
      if (res.label) {
        if (!labelMap.has(res.label)) labelMap.set(res.label, []);
        labelMap.get(res.label).push(res);
      }
    }
    for (const [labelKey, group] of labelMap.entries()) {
      group.sort((a,b) => new Date(a.createdAt) - new Date(b.createdAt));
      group.forEach(r => processedIds.add(r.id));
      groupedResources.push({
        id: `group-label-${labelKey}`,
        title: `${group.length} Resources - ${group[0].title.split(' - ')[0] || 'Resource Group'}`,
        description: `Group of ${group.length} related resources (label: ${labelKey})`,
        type: 'GROUP',
        isGroup: true,
        resources: group,
        createdAt: group[0].createdAt,
        createdBy: group[0].createdBy,
        course: group[0].course,
        unit: group[0].unit,
        totalSize: group.reduce((sum, r) => sum + (r.fileSize || 0), 0),
        fileTypes: [...new Set(group.map(r => r.type))]
      });
    }
    
    resourcesWithPaths.forEach(resource => {
      if (processedIds.has(resource.id)) return;
      const uploadTime = new Date(resource.createdAt).getTime();
      const timeWindow = 5 * 60 * 1000; // 5 minutes
      const group = [resource];
      processedIds.add(resource.id);
      resourcesWithPaths.forEach(otherResource => {
        if (otherResource.id === resource.id || processedIds.has(otherResource.id)) return;
        const otherUploadTime = new Date(otherResource.createdAt).getTime();
        if (Math.abs(uploadTime - otherUploadTime) <= timeWindow) {
          group.push(otherResource);
          processedIds.add(otherResource.id);
        }
      });
      if (group.length > 1) {
        groupedResources.push({
          id: `group-${resource.id}`,
          title: `${group.length} Resources - ${group[0].title.split(' - ')[0] || 'Resource Group'}`,
          description: `Group of ${group.length} related resources uploaded together`,
          type: 'GROUP',
          isGroup: true,
          resources: group,
          createdAt: resource.createdAt,
          createdBy: resource.createdBy,
          course: resource.course,
          unit: resource.unit,
          totalSize: group.reduce((sum, r) => sum + (r.fileSize || 0), 0),
          fileTypes: [...new Set(group.map(r => r.type))]
        });
      } else {
        groupedResources.push(resource);
      }
    });

    res.json({ resources: groupedResources });
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
        filePath: toWebUploadsPath(resource.filePath)
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
    const { title, description, courseId, unitId, tags, isPublic, label } = req.body;

    // Only allow updating own resources
    const existingResource = await prisma.resource.findFirst({
      where: { id, createdById: req.user.userId }
    });

    if (!existingResource) {
      return res.status(404).json({ message: 'Resource not found' });
    }

    const updateData = {};
    if (title) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (courseId !== undefined) updateData.courseId = courseId;
    if (unitId !== undefined) updateData.unitId = unitId;
    if (tags) updateData.tags = Array.isArray(tags) ? tags : [];
    if (isPublic !== undefined) updateData.isPublic = isPublic === 'true' || isPublic === true;
    if (label !== undefined) updateData.label = label || null;

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
        filePath: toWebUploadsPath(resource.filePath)
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
        filePath: toWebUploadsPath(allocatedResource.filePath)
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

// Ungroup a resource group into individual resources
router.post('/:groupId/ungroup', auth, requireRole(['TEACHER']), async (req, res) => {
  try {
    const { groupId } = req.params;
    
    // Get the group resource (this is a virtual group, not stored in DB)
    // We need to find the individual resources that were grouped
    const allResources = await prisma.resource.findMany({
      where: {
        createdBy: {
          organizationId: req.user.organizationId
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    // Find resources that would be grouped together
    const timeWindow = 5 * 60 * 1000; // 5 minutes
    const groupedResources = [];
    const processedIds = new Set();
    
    allResources.forEach(resource => {
      if (processedIds.has(resource.id)) return;
      
      const uploadTime = new Date(resource.createdAt).getTime();
      const group = [resource];
      processedIds.add(resource.id);
      
      allResources.forEach(otherResource => {
        if (otherResource.id === resource.id || processedIds.has(otherResource.id)) return;
        
        const otherUploadTime = new Date(otherResource.createdAt).getTime();
        if (Math.abs(uploadTime - otherUploadTime) <= timeWindow) {
          group.push(otherResource);
          processedIds.add(otherResource.id);
        }
      });
      
      if (group.length > 1) {
        const groupIdGenerated = `group-${resource.id}`;
        if (groupIdGenerated === groupId) {
          // This is the group we want to ungroup
          res.json({ 
            message: 'Group identified. Individual resources are already stored separately in the database.',
            individualResources: group.map(r => ({
              id: r.id,
              title: r.title,
              type: r.type
            }))
          });
          return;
        }
      }
    });

    res.status(404).json({ message: 'Resource group not found' });
  } catch (error) {
    console.error('Error ungrouping resources:', error);
    res.status(500).json({ message: 'Failed to ungroup resources' });
  }
});

// ============================================================================
// ADMIN: Cross-Organization Resource Cloning
// ============================================================================

// Clone a resource to another organization (Admin only)
router.post('/clone', auth, requireRole(['ADMIN']), async (req, res) => {
  try {
    const { 
      sourceResourceId, 
      targetOrganizationId, 
      targetSubjectId, 
      targetCourseId, 
      targetUnitId,
      includeAssignments = false 
    } = req.body;

    console.log('=== CLONING RESOURCE ACROSS ORGANIZATIONS ===');
    console.log('Source Resource ID:', sourceResourceId);
    console.log('Target Organization ID:', targetOrganizationId);
    console.log('Target Subject ID:', targetSubjectId);
    console.log('Include Assignments:', includeAssignments);

    // Validate required fields
    if (!sourceResourceId || !targetOrganizationId || !targetSubjectId) {
      return res.status(400).json({ 
        message: 'Missing required fields: sourceResourceId, targetOrganizationId, targetSubjectId' 
      });
    }

    // Get the source resource with all related data
    const sourceResource = await prisma.resource.findUnique({
      where: { id: sourceResourceId },
      include: {
        subject: true,
        course: true,
        unit: true,
        createdBy: true
      }
    });

    if (!sourceResource) {
      return res.status(404).json({ message: 'Source resource not found' });
    }

    // Verify target organization exists
    const targetOrg = await prisma.organization.findUnique({
      where: { id: targetOrganizationId }
    });

    if (!targetOrg) {
      return res.status(404).json({ message: 'Target organization not found' });
    }

    // Verify target subject exists and belongs to target organization
    const targetSubject = await prisma.subject.findFirst({
      where: { 
        id: targetSubjectId,
        organizationId: targetOrganizationId
      }
    });

    if (!targetSubject) {
      return res.status(404).json({ 
        message: 'Target subject not found or does not belong to target organization' 
      });
    }

    // Verify target course if provided
    let targetCourse = null;
    if (targetCourseId) {
      targetCourse = await prisma.course.findFirst({
        where: { 
          id: targetCourseId,
          subjectId: targetSubjectId
        }
      });

      if (!targetCourse) {
        return res.status(404).json({ 
          message: 'Target course not found or does not belong to target subject' 
        });
      }
    }

    // Verify target unit if provided
    let targetUnit = null;
    if (targetUnitId && targetCourse) {
      targetUnit = await prisma.unit.findFirst({
        where: { 
          id: targetUnitId,
          courseId: targetCourseId
        }
      });

      if (!targetUnit) {
        return res.status(404).json({ 
          message: 'Target unit not found or does not belong to target course' 
        });
      }
    }

    // Copy the file to the uploads directory
    const sourceFilePath = sourceResource.filePath;
    const fileName = path.basename(sourceFilePath);
    const targetFilePath = path.join(__dirname, '../uploads', fileName);
    
    // Copy file (simple file copy for now)
    try {
      const fs = require('fs');
      fs.copyFileSync(sourceFilePath, targetFilePath);
      console.log('File copied successfully');
    } catch (fileError) {
      console.error('File copy error:', fileError);
      return res.status(500).json({ message: 'Failed to copy resource file' });
    }

    // Create the cloned resource
    const clonedResource = await prisma.resource.create({
      data: {
        title: `${sourceResource.title} (Cloned)`,
        description: sourceResource.description ? 
          `${sourceResource.description}\n\n[Cloned from ${sourceResource.subject.name} - ${sourceResource.createdBy.firstName} ${sourceResource.createdBy.lastName}]` : 
          `[Cloned from ${sourceResource.subject.name} - ${sourceResource.createdBy.firstName} ${sourceResource.createdBy.lastName}]`,
        type: sourceResource.type,
        filePath: targetFilePath,
        fileSize: sourceResource.fileSize,
        mimeType: sourceResource.mimeType,
        isShared: false, // Cloned resources are not shared by default
        isPublic: sourceResource.isPublic,
        tags: sourceResource.tags,
        subjectId: targetSubjectId,
        courseId: targetCourseId || null,
        unitId: targetUnitId || null,
        createdById: req.user.userId // The admin who cloned it
      },
      include: {
        subject: true,
        course: true,
        unit: true,
        createdBy: true
      }
    });

    console.log('Resource cloned successfully:', clonedResource.id);

    // Clone assignments if requested
    let clonedAssignments = [];
    if (includeAssignments) {
      const sourceAssignments = await prisma.assessment.findMany({
        where: { 
          resourceId: sourceResourceId 
        },
        include: {
          questions: true,
          options: true
        }
      });

      for (const assignment of sourceAssignments) {
        const clonedAssignment = await prisma.assessment.create({
          data: {
            title: `${assignment.title} (Cloned)`,
            description: assignment.description ? 
              `${assignment.description}\n\n[Cloned from ${sourceResource.subject.name}]` : 
              `[Cloned from ${sourceResource.subject.name}]`,
            type: assignment.type,
            subtype: assignment.subtype,
            category: assignment.category,
            difficulty: assignment.difficulty,
            timeLimit: assignment.timeLimit,
            points: assignment.points,
            instructions: assignment.instructions,
            criteria: assignment.criteria,
            autoGrade: assignment.autoGrade,
            showFeedback: assignment.showFeedback,
            dueDate: assignment.dueDate,
            availableFrom: assignment.availableFrom,
            availableTo: assignment.availableTo,
            quarter: assignment.quarter,
            maxAttempts: assignment.maxAttempts,
            shuffleQuestions: assignment.shuffleQuestions,
            allowReview: assignment.allowReview,
            tags: assignment.tags,
            courseId: targetCourseId || null,
            unitId: targetUnitId || null,
            subjectId: targetSubjectId,
            resourceId: clonedResource.id,
            createdById: req.user.userId,
            published: false // Cloned assignments start as unpublished
          }
        });

        // Clone questions and options
        for (const question of assignment.questions) {
          const clonedQuestion = await prisma.question.create({
            data: {
              question: question.question,
              type: question.type,
              order: question.order,
              points: question.points,
              assessmentId: clonedAssignment.id
            }
          });

          // Clone options for multiple choice questions
          if (question.type === 'MULTIPLE_CHOICE') {
            for (const option of question.options) {
              await prisma.option.create({
                data: {
                  text: option.text,
                  isCorrect: option.isCorrect,
                  questionId: clonedQuestion.id
                }
              });
            }
          }
        }

        clonedAssignments.push(clonedAssignment);
        console.log('Assignment cloned:', clonedAssignment.id);
      }
    }

    // Create audit log entry
    await prisma.auditLog.create({
      data: {
        action: 'RESOURCE_CLONED',
        userId: req.user.userId,
        organizationId: req.user.organizationId,
        details: {
          sourceResourceId: sourceResource.id,
          sourceOrganizationId: sourceResource.subject.organizationId,
          targetOrganizationId: targetOrganizationId,
          targetSubjectId: targetSubjectId,
          clonedResourceId: clonedResource.id,
          includeAssignments: includeAssignments,
          clonedAssignmentsCount: clonedAssignments.length
        },
        timestamp: new Date()
      }
    });

    res.status(201).json({
      message: 'Resource cloned successfully',
      clonedResource: {
        ...clonedResource,
        filePath: toWebUploadsPath(targetFilePath)
      },
      clonedAssignments: clonedAssignments.length,
      auditLog: 'Cross-organization clone operation logged'
    });

  } catch (error) {
    console.error('Resource cloning error:', error);
    res.status(500).json({ 
      message: 'Failed to clone resource', 
      details: error.message 
    });
  }
});

// Get available organizations for cloning (Admin only)
router.get('/clone/organizations', auth, requireRole(['ADMIN']), async (req, res) => {
  try {
    const organizations = await prisma.organization.findMany({
      select: {
        id: true,
        name: true,
        code: true,
        subjects: {
          select: {
            id: true,
            name: true,
            courses: {
              select: {
                id: true,
                name: true,
                units: {
                  select: {
                    id: true,
                    name: true
                  }
                }
              }
            }
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    res.json({ organizations });
  } catch (error) {
    console.error('Get organizations error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get cloneable resources (Admin only)
router.get('/clone/resources', auth, requireRole(['ADMIN']), async (req, res) => {
  try {
    const { organizationId, subjectId } = req.query;
    
    const where = {};
    if (organizationId) {
      where.subject = { organizationId };
    }
    if (subjectId) {
      where.subjectId = subjectId;
    }

    const resources = await prisma.resource.findMany({
      where,
      include: {
        subject: {
          select: {
            id: true,
            name: true,
            organization: {
              select: {
                id: true,
                name: true,
                code: true
              }
            }
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
            name: true
          }
        },
        createdBy: {
          select: {
            firstName: true,
            lastName: true
          }
        },
        assessments: {
          select: {
            id: true,
            title: true,
            type: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ 
      resources: resources.map(r => ({
        ...r,
        filePath: r.filePath ? `/uploads/${path.basename(r.filePath)}` : null,
        assignmentCount: r.assessments.length
      }))
    });
  } catch (error) {
    console.error('Get cloneable resources error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 