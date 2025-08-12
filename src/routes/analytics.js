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
        metadata: metadata || {},
        // Mobile detection
        isMobile: req.headers['user-agent']?.includes('Mobile') || false,
        screenFocus: true,
        appSwitches: 0
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

// Track app focus/blur events (for mobile detection)
router.post('/focus', auth, requireRole(['STUDENT']), [
  body('sessionId').notEmpty().withMessage('Session ID is required'),
  body('isFocused').isBoolean().withMessage('Focus state must be boolean'),
  body('timestamp').optional()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { sessionId, isFocused, timestamp } = req.body;

    // Update session with focus state
    await prisma.studentSession.update({
      where: { 
        id: sessionId,
        studentId: req.user.userId
      },
      data: {
        screenFocus: isFocused,
        appSwitches: {
          increment: isFocused ? 0 : 1 // Increment switch count when app loses focus
        },
        lastActive: timestamp ? new Date(timestamp) : new Date()
      }
    });

    res.json({ message: 'Focus state updated' });
  } catch (error) {
    console.error('Focus tracking error:', error);
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
    // TEMPORARILY DISABLED - Assignment model doesn't exist
    return res.status(501).json({ message: 'Assignment tracking temporarily disabled' });
    
    /*
    const assignment = await prisma.assignment.findFirst({
      where: { 
        id: assignmentId,
        schoolId: student.schoolId
      }
    });

    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }
    */

    // Check if attempt already exists
    const existingAttempt = await prisma.assessmentSubmission.findUnique({
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

// Get progress vs time spent report
router.get('/student/:studentId/progress-time-report', auth, requireRole(['TEACHER', 'ADMIN']), async (req, res) => {
  try {
    const { studentId } = req.params;
    const { period = '30d', groupBy = 'assignment' } = req.query; // groupBy: 'assignment', 'week', 'month'

    const teacher = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { organizationId: true }
    });

    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found' });
    }

    // Verify student belongs to teacher's organization
    const student = await prisma.user.findFirst({
      where: { 
        id: studentId,
        organizationId: teacher.organizationId,
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
        startDate.setDate(now.getDate() - 30);
    }

    // Get all assignment submissions with timing data
    const submissions = await prisma.assessmentSubmission.findMany({
      where: {
        studentId,
        startedAt: {
          gte: startDate
        },
        status: 'COMPLETED' // Only completed assignments for accurate analysis
      },
      include: {
        assessment: {
          select: {
            id: true,
            title: true,
            type: true,
            difficulty: true,
            points: true,
            category: true
          }
        }
      },
      orderBy: { startedAt: 'asc' }
    });

    // Calculate progress vs time metrics
    const progressTimeData = submissions.map(submission => {
      const timeSpentMinutes = submission.timeSpent ? submission.timeSpent / 60 : 0;
      const scorePercentage = submission.percentage || 0;
      const efficiency = timeSpentMinutes > 0 ? scorePercentage / timeSpentMinutes : 0; // Score per minute
      
      return {
        assignmentId: submission.assessmentId,
        assignmentTitle: submission.assessment.title,
        assignmentType: submission.assessment.type,
        difficulty: submission.assessment.difficulty,
        category: submission.assessment.category,
        startedAt: submission.startedAt,
        submittedAt: submission.submittedAt,
        timeSpentMinutes: Math.round(timeSpentMinutes * 100) / 100,
        timeSpentSeconds: submission.timeSpent,
        score: submission.score,
        scorePercentage: Math.round(scorePercentage * 100) / 100,
        efficiency: Math.round(efficiency * 100) / 100, // Score per minute
        maxScore: submission.maxScore,
        points: submission.assessment.points
      };
    });

    // Group data based on request
    let groupedData;
    if (groupBy === 'week') {
      groupedData = groupByWeek(progressTimeData);
    } else if (groupBy === 'month') {
      groupedData = groupByMonth(progressTimeData);
    } else {
      // Default: group by assignment
      groupedData = groupByAssignment(progressTimeData);
    }

    // Calculate overall trends
    const overallTrends = calculateOverallTrends(progressTimeData);

    // Generate efficiency insights
    const efficiencyInsights = generateEfficiencyInsights(progressTimeData);

    const report = {
      student: {
        id: student.id,
        name: `${student.firstName} ${student.lastName}`,
        email: student.email
      },
      period: {
        start: startDate,
        end: now,
        days: Math.ceil((now - startDate) / (1000 * 60 * 60 * 24))
      },
      summary: {
        totalAssignments: submissions.length,
        totalTimeSpent: Math.round(progressTimeData.reduce((sum, item) => sum + item.timeSpentMinutes, 0) * 100) / 100,
        averageScore: Math.round(progressTimeData.reduce((sum, item) => sum + item.scorePercentage, 0) / progressTimeData.length * 100) / 100,
        averageEfficiency: Math.round(progressTimeData.reduce((sum, item) => sum + item.efficiency, 0) / progressTimeData.length * 100) / 100,
        bestEfficiency: Math.max(...progressTimeData.map(item => item.efficiency)),
        worstEfficiency: Math.min(...progressTimeData.map(item => item.efficiency))
      },
      trends: overallTrends,
      insights: efficiencyInsights,
      detailedData: groupedData,
      rawData: progressTimeData // For detailed analysis
    };

    res.json({ progressTimeReport: report });
  } catch (error) {
    console.error('Progress time report error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Helper function to group by assignment
function groupByAssignment(data) {
  return data.map(item => ({
    group: item.assignmentTitle,
    data: [item],
    summary: {
      totalTime: item.timeSpentMinutes,
      averageScore: item.scorePercentage,
      efficiency: item.efficiency,
      type: item.assignmentType,
      difficulty: item.difficulty
    }
  }));
}

// Helper function to group by week
function groupByWeek(data) {
  const weeks = {};
  
  data.forEach(item => {
    const weekStart = getWeekStart(item.startedAt);
    const weekKey = weekStart.toISOString().split('T')[0];
    
    if (!weeks[weekKey]) {
      weeks[weekKey] = [];
    }
    weeks[weekKey].push(item);
  });

  return Object.entries(weeks).map(([week, items]) => ({
    group: week,
    data: items,
    summary: {
      totalTime: Math.round(items.reduce((sum, item) => sum + item.timeSpentMinutes, 0) * 100) / 100,
      averageScore: Math.round(items.reduce((sum, item) => sum + item.scorePercentage, 0) / items.length * 100) / 100,
      averageEfficiency: Math.round(items.reduce((sum, item) => sum + item.efficiency, 0) / items.length * 100) / 100,
      assignmentCount: items.length
    }
  }));
}

// Helper function to group by month
function groupByMonth(data) {
  const months = {};
  
  data.forEach(item => {
    const monthKey = `${item.startedAt.getFullYear()}-${String(item.startedAt.getMonth() + 1).padStart(2, '0')}`;
    
    if (!months[monthKey]) {
      months[monthKey] = [];
    }
    months[monthKey].push(item);
  });

  return Object.entries(months).map(([month, items]) => ({
    group: month,
    data: items,
    summary: {
      totalTime: Math.round(items.reduce((sum, item) => sum + item.timeSpentMinutes, 0) * 100) / 100,
      averageScore: Math.round(items.reduce((sum, item) => sum + item.scorePercentage, 0) / items.length * 100) / 100,
      averageEfficiency: Math.round(items.reduce((sum, item) => sum + item.efficiency, 0) / items.length * 100) / 100,
      assignmentCount: items.length
    }
  }));
}

// Helper function to get week start
function getWeekStart(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  return new Date(d.setDate(diff));
}

// Helper function to calculate overall trends
function calculateOverallTrends(data) {
  if (data.length < 2) return { trend: 'insufficient_data' };

  const sortedData = data.sort((a, b) => new Date(a.startedAt) - new Date(b.startedAt));
  const halfPoint = Math.floor(sortedData.length / 2);
  
  const firstHalf = sortedData.slice(0, halfPoint);
  const secondHalf = sortedData.slice(halfPoint);

  const firstHalfAvgEfficiency = firstHalf.reduce((sum, item) => sum + item.efficiency, 0) / firstHalf.length;
  const secondHalfAvgEfficiency = secondHalf.reduce((sum, item) => sum + item.efficiency, 0) / secondHalf.length;

  const efficiencyChange = secondHalfAvgEfficiency - firstHalfAvgEfficiency;
  
  return {
    efficiencyTrend: efficiencyChange > 0.5 ? 'improving' : efficiencyChange < -0.5 ? 'declining' : 'stable',
    efficiencyChange: Math.round(efficiencyChange * 100) / 100,
    firstHalfEfficiency: Math.round(firstHalfAvgEfficiency * 100) / 100,
    secondHalfEfficiency: Math.round(secondHalfAvgEfficiency * 100) / 100
  };
}

// Helper function to generate efficiency insights
function generateEfficiencyInsights(data) {
  const insights = [];
  
  if (data.length === 0) {
    insights.push('No completed assignments in this period');
    return insights;
  }

  // Find most efficient assignment
  const mostEfficient = data.reduce((max, item) => item.efficiency > max.efficiency ? item : max);
  insights.push(`Most efficient: ${mostEfficient.assignmentTitle} (${mostEfficient.efficiency} score/min)`);

  // Find least efficient assignment
  const leastEfficient = data.reduce((min, item) => item.efficiency < min.efficiency ? item : min);
  insights.push(`Least efficient: ${leastEfficient.assignmentTitle} (${leastEfficient.efficiency} score/min)`);

  // Time analysis
  const avgTime = data.reduce((sum, item) => sum + item.timeSpentMinutes, 0) / data.length;
  if (avgTime > 45) {
    insights.push('Student tends to spend a lot of time on assignments - may need time management help');
  } else if (avgTime < 10) {
    insights.push('Student completes assignments very quickly - may need more challenging content');
  }

  // Score analysis
  const avgScore = data.reduce((sum, item) => sum + item.scorePercentage, 0) / data.length;
  if (avgScore < 70) {
    insights.push('Student scores are below average - may need additional support');
  } else if (avgScore > 90) {
    insights.push('Student consistently scores high - may need more challenging assignments');
  }

  // Efficiency trend
  const efficiencyTrend = calculateOverallTrends(data);
  if (efficiencyTrend.efficiencyTrend === 'improving') {
    insights.push('Student is becoming more efficient over time - great progress!');
  } else if (efficiencyTrend.efficiencyTrend === 'declining') {
    insights.push('Student efficiency is declining - may need intervention');
  }

  return insights;
}

// Get comprehensive student report for parent meetings
router.get('/student/:studentId/parent-report', auth, requireRole(['TEACHER', 'ADMIN']), async (req, res) => {
  try {
    const { studentId } = req.params;
    const { period = '30d' } = req.query; // Default to 30 days

    const teacher = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { organizationId: true }
    });

    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found' });
    }

    // Verify student belongs to teacher's organization
    const student = await prisma.user.findFirst({
      where: { 
        id: studentId,
        organizationId: teacher.organizationId,
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
        startDate.setDate(now.getDate() - 30);
    }

    // Get all session data
    const sessions = await prisma.userSession.findMany({
      where: {
        userId: studentId,
        startTime: {
          gte: startDate
        }
      },
      orderBy: { startTime: 'desc' }
    });

    // Get all activity data
    const activities = await prisma.studentActivity.findMany({
      where: {
        studentId,
        timestamp: {
          gte: startDate
        }
      },
      orderBy: { timestamp: 'desc' }
    });

    // Get all assignment submissions
    const submissions = await prisma.assessmentSubmission.findMany({
      where: {
        studentId,
        startedAt: {
          gte: startDate
        }
      },
      include: {
        assessment: {
          select: {
            title: true,
            type: true,
            points: true
          }
        }
      },
      orderBy: { startedAt: 'desc' }
    });

    // Calculate key metrics for parent reporting
    const totalSessions = sessions.length;
    const totalSessionTime = sessions
      .filter(s => s.duration)
      .reduce((sum, s) => sum + s.duration, 0);
    
    const completedAssignments = submissions.filter(s => s.status === 'COMPLETED').length;
    const startedAssignments = submissions.filter(s => s.status === 'IN_PROGRESS').length;
    const abandonedAssignments = submissions.filter(s => s.status === 'ABANDONED').length;
    
    // Mobile behavior analysis
    const mobileSessions = sessions.filter(s => s.isMobile);
    const appSwitches = sessions.reduce((sum, s) => sum + (s.appSwitches || 0), 0);
    const focusTime = sessions.filter(s => s.screenFocus).length;
    
    // Suspicious patterns
    const shortSessions = sessions.filter(s => s.duration && s.duration < 300).length; // < 5 minutes
    const rapidSwitches = sessions.filter(s => s.appSwitches && s.appSwitches > 3).length;
    
    // Progress analysis
    const averageScore = submissions.length > 0 
      ? submissions.reduce((sum, s) => sum + (s.score || 0), 0) / submissions.length
      : 0;
    
    const improvementTrend = calculateImprovementTrend(submissions);
    
    // Generate parent-friendly report
    const parentReport = {
      student: {
        id: student.id,
        name: `${student.firstName} ${student.lastName}`,
        email: student.email
      },
      period: {
        start: startDate,
        end: now,
        days: Math.ceil((now - startDate) / (1000 * 60 * 60 * 24))
      },
      engagement: {
        totalSessions,
        totalHours: Math.round((totalSessionTime / 3600) * 100) / 100,
        averageSessionLength: totalSessions > 0 ? Math.round(totalSessionTime / totalSessions) : 0,
        completedAssignments,
        startedAssignments,
        abandonedAssignments,
        completionRate: (completedAssignments + startedAssignments) > 0 
          ? Math.round((completedAssignments / (completedAssignments + startedAssignments)) * 100)
          : 0
      },
      mobileBehavior: {
        mobileSessions: mobileSessions.length,
        appSwitches,
        focusTime,
        suspiciousPatterns: {
          shortSessions,
          rapidSwitches,
          totalSuspicious: shortSessions + rapidSwitches
        }
      },
      academic: {
        averageScore: Math.round(averageScore * 100) / 100,
        improvementTrend,
        totalAssignments: submissions.length,
        recentScores: submissions.slice(0, 5).map(s => ({
          assignment: s.assessment.title,
          score: s.score,
          date: s.submittedAt
        }))
      },
      recommendations: generateRecommendations({
        totalSessions,
        completedAssignments,
        averageScore,
        appSwitches,
        shortSessions
      }),
      detailedActivity: activities.slice(0, 20) // Last 20 activities
    };

    res.json({ parentReport });
  } catch (error) {
    console.error('Parent report error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Helper function to calculate improvement trend
function calculateImprovementTrend(submissions) {
  if (submissions.length < 2) return 'insufficient_data';
  
  const sortedSubmissions = submissions
    .filter(s => s.score !== null)
    .sort((a, b) => new Date(a.submittedAt) - new Date(b.submittedAt));
  
  if (sortedSubmissions.length < 2) return 'insufficient_data';
  
  const firstHalf = sortedSubmissions.slice(0, Math.floor(sortedSubmissions.length / 2));
  const secondHalf = sortedSubmissions.slice(Math.floor(sortedSubmissions.length / 2));
  
  const firstAvg = firstHalf.reduce((sum, s) => sum + s.score, 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((sum, s) => sum + s.score, 0) / secondHalf.length;
  
  if (secondAvg > firstAvg + 5) return 'improving';
  if (secondAvg < firstAvg - 5) return 'declining';
  return 'stable';
}

// Helper function to generate recommendations
function generateRecommendations(metrics) {
  const recommendations = [];
  
  if (metrics.totalSessions < 5) {
    recommendations.push('Student needs to log in more frequently');
  }
  
  if (metrics.completedAssignments < 3) {
    recommendations.push('Student should complete more assignments');
  }
  
  if (metrics.averageScore < 70) {
    recommendations.push('Student may need additional academic support');
  }
  
  if (metrics.appSwitches > 10) {
    recommendations.push('Student frequently switches apps - may need supervision');
  }
  
  if (metrics.shortSessions > 5) {
    recommendations.push('Student has many short sessions - may indicate lack of focus');
  }
  
  return recommendations;
}

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

    // TEMPORARILY DISABLED - AssignmentAttempt model doesn't exist
    const attempts = [];
    
    // Calculate analytics
    const totalSessionTime = sessions
      .filter(s => s.duration)
      .reduce((sum, s) => sum + s.duration, 0);

    const completedAssignments = 0; // TEMPORARILY DISABLED
    const startedAssignments = 0; // TEMPORARILY DISABLED
    const abandonedAssignments = 0; // TEMPORARILY DISABLED

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

    // TEMPORARILY DISABLED - AssignmentAttempt model doesn't exist
    const attempts = [];

    // Calculate school analytics
    const totalSessionTime = sessions
      .filter(s => s.duration)
      .reduce((sum, s) => sum + s.duration, 0);

    const completedAssignments = 0; // TEMPORARILY DISABLED
    const totalAssignments = 0; // TEMPORARILY DISABLED
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
      submissions: {
        where: {
          startedAt: {
            gte: startDate,
            lte: endDate
          },
          status: 'COMPLETED'
        },
        select: {
          score: true,
          timeSpent: true
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
    const completedAssignments = student.submissions.length;
    const averageScore = student.submissions.length > 0
      ? student.submissions.reduce((sum, a) => sum + (a.score || 0), 0) / student.submissions.length
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