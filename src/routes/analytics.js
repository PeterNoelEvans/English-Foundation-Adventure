const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { body, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const requireRole = auth.requireRole;

const prisma = new PrismaClient();

// Track student session start
router.post('/session/start', auth, requireRole(['STUDENT']), [
  body('sessionType').notEmpty().withMessage('Session type is required'),
  body('metadata').optional()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { sessionType, metadata } = req.body;

    const student = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { schoolId: true }
    });

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    const session = await prisma.studentSession.create({
      data: {
        studentId: req.user.userId,
        schoolId: student.schoolId,
        sessionType,
        metadata: metadata || {}
      }
    });

    res.status(201).json({ 
      message: 'Session started', 
      sessionId: session.id 
    });
  } catch (error) {
    console.error('Session start error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Track student session end
router.patch('/session/:sessionId/end', auth, requireRole(['STUDENT']), async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = await prisma.studentSession.findFirst({
      where: { 
        id: sessionId,
        studentId: req.user.userId,
        endTime: null
      }
    });

    if (!session) {
      return res.status(404).json({ message: 'Active session not found' });
    }

    const endTime = new Date();
    const duration = Math.floor((endTime - session.startTime) / 1000); // Duration in seconds

    const updatedSession = await prisma.studentSession.update({
      where: { id: sessionId },
      data: {
        endTime,
        duration
      }
    });

    res.json({ 
      message: 'Session ended', 
      session: updatedSession 
    });
  } catch (error) {
    console.error('Session end error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Track student activity
router.post('/activity', auth, requireRole(['STUDENT']), [
  body('activityType').notEmpty().withMessage('Activity type is required'),
  body('page').optional(),
  body('assignmentId').optional(),
  body('questionId').optional(),
  body('resourceId').optional(),
  body('metadata').optional()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { activityType, page, assignmentId, questionId, resourceId, metadata } = req.body;

    const student = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { schoolId: true }
    });

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    const activity = await prisma.studentActivity.create({
      data: {
        studentId: req.user.userId,
        schoolId: student.schoolId,
        activityType,
        page,
        assignmentId,
        questionId,
        resourceId,
        metadata: metadata || {}
      }
    });

    res.status(201).json({ 
      message: 'Activity tracked', 
      activityId: activity.id 
    });
  } catch (error) {
    console.error('Activity tracking error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Start assignment attempt
router.post('/assignment/start', auth, requireRole(['STUDENT']), [
  body('assignmentId').notEmpty().withMessage('Assignment ID is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { assignmentId } = req.body;

    const student = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { schoolId: true }
    });

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Check if assignment exists and belongs to student's school
    const assignment = await prisma.assignment.findFirst({
      where: { 
        id: assignmentId,
        schoolId: student.schoolId
      }
    });

    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    // Check if attempt already exists
    const existingAttempt = await prisma.assignmentAttempt.findUnique({
      where: {
        studentId_assignmentId: {
          studentId: req.user.userId,
          assignmentId
        }
      }
    });

    if (existingAttempt) {
      // Update existing attempt
      const updatedAttempt = await prisma.assignmentAttempt.update({
        where: { id: existingAttempt.id },
        data: {
          status: 'IN_PROGRESS',
          startTime: new Date()
        }
      });

      return res.json({ 
        message: 'Assignment attempt resumed', 
        attemptId: updatedAttempt.id 
      });
    }

    // Create new attempt
    const attempt = await prisma.assignmentAttempt.create({
      data: {
        studentId: req.user.userId,
        assignmentId,
        schoolId: student.schoolId,
        status: 'STARTED'
      }
    });

    res.status(201).json({ 
      message: 'Assignment attempt started', 
      attemptId: attempt.id 
    });
  } catch (error) {
    console.error('Assignment start error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Complete assignment attempt
router.patch('/assignment/:attemptId/complete', auth, requireRole(['STUDENT']), [
  body('answers').optional(),
  body('score').optional(),
  body('feedback').optional()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { attemptId } = req.params;
    const { answers, score, feedback } = req.body;

    const attempt = await prisma.assignmentAttempt.findFirst({
      where: { 
        id: attemptId,
        studentId: req.user.userId
      }
    });

    if (!attempt) {
      return res.status(404).json({ message: 'Assignment attempt not found' });
    }

    const endTime = new Date();
    const totalTime = Math.floor((endTime - attempt.startTime) / 1000); // Total time in seconds

    const updatedAttempt = await prisma.assignmentAttempt.update({
      where: { id: attemptId },
      data: {
        status: 'COMPLETED',
        endTime,
        totalTime,
        answers: answers || {},
        score: score || null,
        feedback: feedback || {}
      }
    });

    res.json({ 
      message: 'Assignment completed', 
      attempt: updatedAttempt 
    });
  } catch (error) {
    console.error('Assignment completion error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get student analytics (for teachers/admins)
router.get('/student/:studentId', auth, requireRole(['TEACHER', 'ADMIN']), async (req, res) => {
  try {
    const { studentId } = req.params;
    const { period } = req.query; // e.g., '7d', '30d', '90d'

    const teacher = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { schoolId: true }
    });

    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found' });
    }

    // Verify student belongs to teacher's school
    const student = await prisma.user.findFirst({
      where: { 
        id: studentId,
        schoolId: teacher.schoolId,
        role: 'STUDENT'
      }
    });

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Calculate date range
    const now = new Date();
    let startDate = new Date();
    
    switch (period) {
      case '7d':
        startDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(now.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(now.getDate() - 90);
        break;
      default:
        startDate.setDate(now.getDate() - 30); // Default to 30 days
    }

    // Get sessions
    const sessions = await prisma.studentSession.findMany({
      where: {
        studentId,
        startTime: {
          gte: startDate
        }
      },
      orderBy: { startTime: 'desc' }
    });

    // Get activities
    const activities = await prisma.studentActivity.findMany({
      where: {
        studentId,
        timestamp: {
          gte: startDate
        }
      },
      include: {
        assignment: true,
        resource: true
      },
      orderBy: { timestamp: 'desc' }
    });

    // Get assignment attempts
    const attempts = await prisma.assignmentAttempt.findMany({
      where: {
        studentId,
        startTime: {
          gte: startDate
        }
      },
      include: {
        assignment: true
      },
      orderBy: { startTime: 'desc' }
    });

    // Calculate analytics
    const totalSessionTime = sessions
      .filter(s => s.duration)
      .reduce((sum, s) => sum + s.duration, 0);

    const completedAssignments = attempts.filter(a => a.status === 'COMPLETED').length;
    const startedAssignments = attempts.filter(a => a.status === 'STARTED' || a.status === 'IN_PROGRESS').length;
    const abandonedAssignments = attempts.filter(a => a.status === 'ABANDONED').length;

    const activityBreakdown = activities.reduce((acc, activity) => {
      acc[activity.activityType] = (acc[activity.activityType] || 0) + 1;
      return acc;
    }, {});

    const analytics = {
      student: {
        id: student.id,
        firstName: student.firstName,
        lastName: student.lastName,
        email: student.email
      },
      period: {
        start: startDate,
        end: now
      },
      sessions: {
        total: sessions.length,
        totalTime: totalSessionTime,
        averageTime: sessions.length > 0 ? Math.round(totalSessionTime / sessions.length) : 0
      },
      assignments: {
        completed: completedAssignments,
        started: startedAssignments,
        abandoned: abandonedAssignments,
        completionRate: (completedAssignments + startedAssignments) > 0 
          ? Math.round((completedAssignments / (completedAssignments + startedAssignments)) * 100)
          : 0
      },
      activities: {
        total: activities.length,
        breakdown: activityBreakdown
      },
      recentActivity: activities.slice(0, 10),
      recentSessions: sessions.slice(0, 5),
      recentAttempts: attempts.slice(0, 5)
    };

    res.json({ analytics });
  } catch (error) {
    console.error('Get student analytics error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get school-wide analytics (for admins)
router.get('/school', auth, requireRole(['ADMIN']), async (req, res) => {
  try {
    const { period } = req.query;

    const admin = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { schoolId: true }
    });

    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    // Calculate date range
    const now = new Date();
    let startDate = new Date();
    
    switch (period) {
      case '7d':
        startDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(now.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(now.getDate() - 90);
        break;
      default:
        startDate.setDate(now.getDate() - 30);
    }

    // Get all students in the school
    const students = await prisma.user.findMany({
      where: {
        schoolId: admin.schoolId,
        role: 'STUDENT'
      },
      select: { id: true, firstName: true, lastName: true }
    });

    // Get school-wide data
    const sessions = await prisma.studentSession.findMany({
      where: {
        schoolId: admin.schoolId,
        startTime: {
          gte: startDate
        }
      }
    });

    const activities = await prisma.studentActivity.findMany({
      where: {
        schoolId: admin.schoolId,
        timestamp: {
          gte: startDate
        }
      }
    });

    const attempts = await prisma.assignmentAttempt.findMany({
      where: {
        schoolId: admin.schoolId,
        startTime: {
          gte: startDate
        }
      }
    });

    // Calculate school analytics
    const totalSessionTime = sessions
      .filter(s => s.duration)
      .reduce((sum, s) => sum + s.duration, 0);

    const completedAssignments = attempts.filter(a => a.status === 'COMPLETED').length;
    const totalAssignments = attempts.length;
    const completionRate = totalAssignments > 0 
      ? Math.round((completedAssignments / totalAssignments) * 100)
      : 0;

    const activeStudents = new Set(sessions.map(s => s.studentId)).size;
    const totalStudents = students.length;
    const engagementRate = totalStudents > 0 
      ? Math.round((activeStudents / totalStudents) * 100)
      : 0;

    const analytics = {
      school: {
        id: admin.schoolId,
        totalStudents,
        activeStudents,
        engagementRate
      },
      period: {
        start: startDate,
        end: now
      },
      sessions: {
        total: sessions.length,
        totalTime: totalSessionTime,
        averageTime: sessions.length > 0 ? Math.round(totalSessionTime / sessions.length) : 0
      },
      assignments: {
        total: totalAssignments,
        completed: completedAssignments,
        completionRate
      },
      activities: {
        total: activities.length
      },
      topStudents: await getTopStudents(admin.schoolId, startDate, now)
    };

    res.json({ analytics });
  } catch (error) {
    console.error('Get school analytics error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Helper function to get top performing students
async function getTopStudents(schoolId, startDate, endDate) {
  const students = await prisma.user.findMany({
    where: {
      schoolId,
      role: 'STUDENT'
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      assignmentAttempts: {
        where: {
          startTime: {
            gte: startDate,
            lte: endDate
          },
          status: 'COMPLETED'
        },
        select: {
          score: true,
          totalTime: true
        }
      },
      studentSessions: {
        where: {
          startTime: {
            gte: startDate,
            lte: endDate
          }
        },
        select: {
          duration: true
        }
      }
    }
  });

  const studentStats = students.map(student => {
    const completedAssignments = student.assignmentAttempts.length;
    const averageScore = student.assignmentAttempts.length > 0
      ? student.assignmentAttempts.reduce((sum, a) => sum + (a.score || 0), 0) / student.assignmentAttempts.length
      : 0;
    const totalTime = student.studentSessions
      .filter(s => s.duration)
      .reduce((sum, s) => sum + s.duration, 0);

    return {
      id: student.id,
      name: `${student.firstName} ${student.lastName}`,
      completedAssignments,
      averageScore: Math.round(averageScore * 100) / 100,
      totalTime,
      engagementScore: Math.round((completedAssignments * 0.4 + (averageScore / 100) * 0.4 + (totalTime / 3600) * 0.2) * 100) / 100
    };
  });

  return studentStats
    .sort((a, b) => b.engagementScore - a.engagementScore)
    .slice(0, 10);
}

module.exports = router; 