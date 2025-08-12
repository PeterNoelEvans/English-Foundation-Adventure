const express = require('express');
const { body, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const auth = require('../middleware/auth');
const { requireRole } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Record daily progress
router.post('/daily', auth, requireRole(['STUDENT', 'TEACHER']), [
  body('assignmentId').notEmpty().withMessage('Assignment ID is required'),
  body('score').optional().isInt({ min: 0, max: 100 }).withMessage('Score must be between 0 and 100'),
  body('timeSpentMinutes').optional().isInt({ min: 0 }).withMessage('Time spent must be a positive integer'),
  body('completed').optional().isBoolean().withMessage('Completed must be a boolean')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { assignmentId, score, timeSpentMinutes, completed = false } = req.body;
    const studentId = req.user.userId;
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format

    // Check if progress already exists for today
    const existingProgress = await prisma.dailyProgress.findUnique({
      where: {
        studentId_assignmentId_date: {
          studentId,
          assignmentId,
          date: new Date(today)
        }
      }
    });

    let progress;
    if (existingProgress) {
      // Update existing progress
      progress = await prisma.dailyProgress.update({
        where: { id: existingProgress.id },
        data: {
          score: score !== undefined ? score : existingProgress.score,
          timeSpentMinutes: timeSpentMinutes !== undefined ? timeSpentMinutes : existingProgress.timeSpentMinutes,
          completed,
          attempts: existingProgress.attempts + 1,
          updatedAt: new Date()
        }
      });
    } else {
      // Create new progress
      progress = await prisma.dailyProgress.create({
        data: {
          studentId,
          assignmentId,
          date: new Date(today),
          score,
          timeSpentMinutes,
          completed,
          attempts: 1
        }
      });
    }

    // Trigger weekly progress calculation
    await calculateWeeklyProgress(studentId);

    res.json({ 
      message: 'Progress recorded successfully',
      progress 
    });
  } catch (error) {
    console.error('Error recording progress:', error);
    res.status(500).json({ message: 'Failed to record progress' });
  }
});

// Get student progress
router.get('/student/:studentId', auth, requireRole(['STUDENT', 'TEACHER']), async (req, res) => {
  try {
    const { studentId } = req.params;
    const { startDate, endDate } = req.query;

    // Validate access (students can only see their own progress, teachers can see their students)
    if (req.user.role === 'STUDENT' && req.user.userId !== studentId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const whereClause = { studentId };
    if (startDate && endDate) {
      whereClause.date = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }

    // Get daily progress
    const dailyProgress = await prisma.dailyProgress.findMany({
      where: whereClause,
      include: {
        assignment: {
          select: {
            id: true,
            title: true,
            type: true,
            course: {
              select: {
                name: true,
                subject: {
                  select: { name: true }
                }
              }
            }
          }
        }
      },
      orderBy: { date: 'desc' }
    });

    // Get weekly progress
    const weeklyProgress = await prisma.weeklyProgress.findMany({
      where: { studentId },
      orderBy: { weekStart: 'desc' },
      take: 12 // Last 12 weeks
    });

    // Get learning patterns
    const learningPatterns = await prisma.learningPattern.findMany({
      where: { studentId },
      orderBy: { createdAt: 'desc' }
    });

    // Calculate summary statistics
    const totalScore = dailyProgress.reduce((sum, p) => sum + (p.score || 0), 0);
    const completedAssignments = dailyProgress.filter(p => p.completed).length;
    const averageScore = dailyProgress.length > 0 ? totalScore / dailyProgress.length : 0;

    // Calculate daily averages for the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentProgress = dailyProgress.filter(p => p.date >= thirtyDaysAgo);
    const dailyAverages = {};
    
    recentProgress.forEach(progress => {
      const dateStr = progress.date.toISOString().split('T')[0];
      if (!dailyAverages[dateStr]) {
        dailyAverages[dateStr] = { total: 0, count: 0 };
      }
      if (progress.score !== null) {
        dailyAverages[dateStr].total += progress.score;
        dailyAverages[dateStr].count += 1;
      }
    });

    // Convert to array format for charts
    const dailyAveragesArray = Object.entries(dailyAverages).map(([date, data]) => ({
      date,
      averageScore: data.count > 0 ? data.total / data.count : 0
    }));

    res.json({
      dailyProgress,
      weeklyProgress,
      learningPatterns,
      summary: {
        totalScore,
        completedAssignments,
        averageScore: Math.round(averageScore * 100) / 100,
        totalAssignments: dailyProgress.length
      },
      dailyAverages: dailyAveragesArray
    });
  } catch (error) {
    console.error('Error fetching progress:', error);
    res.status(500).json({ message: 'Failed to fetch progress' });
  }
});

// Get class progress (for teachers)
router.get('/class/:courseId', auth, requireRole(['TEACHER']), async (req, res) => {
  try {
    const { courseId } = req.params;
    const { startDate, endDate } = req.query;

    // Get all students enrolled in this course
    const enrollments = await prisma.enrollment.findMany({
      where: { courseId },
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    const studentIds = enrollments.map(e => e.student.id);
    const whereClause = { studentId: { in: studentIds } };
    
    if (startDate && endDate) {
      whereClause.date = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }

    // Get class progress
    const classProgress = await prisma.dailyProgress.findMany({
      where: whereClause,
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        },
        assignment: {
          select: {
            id: true,
            title: true,
            type: true
          }
        }
      },
      orderBy: { date: 'desc' }
    });

    // Calculate class statistics
    const classStats = {
      totalStudents: studentIds.length,
      totalAssignments: classProgress.length,
      averageScore: 0,
      completionRate: 0
    };

    if (classProgress.length > 0) {
      const totalScore = classProgress.reduce((sum, p) => sum + (p.score || 0), 0);
      const completedAssignments = classProgress.filter(p => p.completed).length;
      
      classStats.averageScore = Math.round((totalScore / classProgress.length) * 100) / 100;
      classStats.completionRate = Math.round((completedAssignments / classProgress.length) * 100);
    }

    res.json({
      classProgress,
      classStats,
      students: enrollments.map(e => e.student)
    });
  } catch (error) {
    console.error('Error fetching class progress:', error);
    res.status(500).json({ message: 'Failed to fetch class progress' });
  }
});

// Calculate weekly progress (internal function)
async function calculateWeeklyProgress(studentId) {
  try {
    const today = new Date();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay()); // Start of week (Sunday)
    
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6); // End of week (Saturday)

    // Get daily progress for this week
    const weekProgress = await prisma.dailyProgress.findMany({
      where: {
        studentId,
        date: {
          gte: weekStart,
          lte: weekEnd
        }
      }
    });

    if (weekProgress.length === 0) return;

    // Calculate weekly statistics
    const totalScore = weekProgress.reduce((sum, p) => sum + (p.score || 0), 0);
    const assignmentsCompleted = weekProgress.filter(p => p.completed).length;
    const averageScore = weekProgress.length > 0 ? totalScore / weekProgress.length : 0;

    // Calculate best and worst days
    const dailyScores = {};
    weekProgress.forEach(progress => {
      const dayOfWeek = progress.date.toLocaleDateString('en-US', { weekday: 'long' });
      if (!dailyScores[dayOfWeek]) {
        dailyScores[dayOfWeek] = { total: 0, count: 0 };
      }
      if (progress.score !== null) {
        dailyScores[dayOfWeek].total += progress.score;
        dailyScores[dayOfWeek].count += 1;
      }
    });

    let bestDay = null;
    let worstDay = null;
    let bestAverage = -1;
    let worstAverage = 101;

    Object.entries(dailyScores).forEach(([day, data]) => {
      const average = data.count > 0 ? data.total / data.count : 0;
      if (average > bestAverage) {
        bestAverage = average;
        bestDay = day;
      }
      if (average < worstAverage && data.count > 0) {
        worstAverage = average;
        worstDay = day;
      }
    });

    // Update or create weekly progress
    await prisma.weeklyProgress.upsert({
      where: {
        studentId_weekStart: {
          studentId,
          weekStart
        }
      },
      update: {
        totalScore,
        assignmentsCompleted,
        averageScore,
        bestDayOfWeek: bestDay,
        worstDayOfWeek: worstDay,
        updatedAt: new Date()
      },
      create: {
        studentId,
        weekStart,
        weekEnd,
        totalScore,
        assignmentsCompleted,
        averageScore,
        bestDayOfWeek: bestDay,
        worstDayOfWeek: worstDay
      }
    });

    // Generate learning patterns
    await generateLearningPatterns(studentId, weekProgress);

  } catch (error) {
    console.error('Error calculating weekly progress:', error);
  }
}

// Generate learning patterns (internal function)
async function generateLearningPatterns(studentId, weekProgress) {
  try {
    if (weekProgress.length === 0) return;

    // Calculate improvement rate
    const sortedProgress = weekProgress.sort((a, b) => a.date - b.date);
    const firstHalf = sortedProgress.slice(0, Math.ceil(sortedProgress.length / 2));
    const secondHalf = sortedProgress.slice(Math.ceil(sortedProgress.length / 2));

    const firstHalfAverage = firstHalf.length > 0 ? 
      firstHalf.reduce((sum, p) => sum + (p.score || 0), 0) / firstHalf.length : 0;
    const secondHalfAverage = secondHalf.length > 0 ? 
      secondHalf.reduce((sum, p) => sum + (p.score || 0), 0) / secondHalf.length : 0;

    const improvementRate = secondHalfAverage - firstHalfAverage;

    // Calculate consistency score
    const scores = weekProgress.map(p => p.score).filter(s => s !== null);
    const averageScore = scores.length > 0 ? scores.reduce((sum, s) => sum + s, 0) / scores.length : 0;
    const variance = scores.length > 0 ? 
      scores.reduce((sum, s) => sum + Math.pow(s - averageScore, 2), 0) / scores.length : 0;
    const consistencyScore = Math.max(0, 100 - Math.sqrt(variance));

    // Store patterns
    await prisma.learningPattern.upsert({
      where: {
        studentId_patternType: {
          studentId,
          patternType: 'improvement_rate'
        }
      },
      update: {
        patternData: { improvementRate, consistencyScore },
        updatedAt: new Date()
      },
      create: {
        studentId,
        patternType: 'improvement_rate',
        patternData: { improvementRate, consistencyScore }
      }
    });

  } catch (error) {
    console.error('Error generating learning patterns:', error);
  }
}

module.exports = router; 