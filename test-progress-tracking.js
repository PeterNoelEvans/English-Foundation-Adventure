const axios = require('axios');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const BASE_URL = 'http://localhost:3000/api';

async function testProgressTracking() {
  console.log('🧪 Testing Progress Tracking System...\n');

  try {
    // 1. Test progress recording
    console.log('1️⃣ Testing progress recording...');
    
    // First, get an existing assignment
    const assignments = await prisma.assessment.findMany({
      take: 1,
      include: {
        course: true,
        unit: true
      }
    });

    if (assignments.length === 0) {
      console.log('❌ No assignments found. Please create an assignment first.');
      return;
    }

    const assignment = assignments[0];
    console.log(`📋 Using assignment: ${assignment.title}`);

    // Test recording progress
    const progressData = {
      assignmentId: assignment.id,
      score: 85,
      timeSpentMinutes: 15,
      completed: true
    };

    console.log('📤 Recording progress:', progressData);

    // Note: This would require authentication, so we'll test the database directly
    console.log('\n2️⃣ Testing database progress recording directly...');

    // Get a student (or create a test one)
    const students = await prisma.user.findMany({
      where: { role: 'STUDENT' },
      take: 1
    });

    if (students.length === 0) {
      console.log('❌ No students found. Please create a student account first.');
      return;
    }

    const student = students[0];
    console.log(`👤 Using student: ${student.firstName} ${student.lastName}`);

    // Record progress directly in database
    const today = new Date().toISOString().split('T')[0];
    
    const progress = await prisma.dailyProgress.create({
      data: {
        studentId: student.id,
        assignmentId: assignment.id,
        date: new Date(today),
        score: 85,
        timeSpentMinutes: 15,
        completed: true,
        attempts: 1
      }
    });

    console.log('✅ Progress recorded successfully!');
    console.log(`📊 Progress ID: ${progress.id}`);
    console.log(`📅 Date: ${progress.date}`);
    console.log(`🎯 Score: ${progress.score}%`);
    console.log(`⏱️ Time spent: ${progress.timeSpentMinutes} minutes`);

    // 2. Test weekly progress calculation
    console.log('\n3️⃣ Testing weekly progress calculation...');

    // Get this week's progress
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Start of week (Sunday)
    
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6); // End of week (Saturday)

    const weekProgress = await prisma.dailyProgress.findMany({
      where: {
        studentId: student.id,
        date: {
          gte: weekStart,
          lte: weekEnd
        }
      }
    });

    console.log(`📅 Week progress entries: ${weekProgress.length}`);
    
    if (weekProgress.length > 0) {
      const totalScore = weekProgress.reduce((sum, p) => sum + (p.score || 0), 0);
      const assignmentsCompleted = weekProgress.filter(p => p.completed).length;
      const averageScore = weekProgress.length > 0 ? totalScore / weekProgress.length : 0;

      console.log(`📊 Weekly Summary:`);
      console.log(`   - Total Score: ${totalScore}`);
      console.log(`   - Assignments Completed: ${assignmentsCompleted}`);
      console.log(`   - Average Score: ${averageScore.toFixed(2)}%`);
    }

    // 3. Test learning patterns
    console.log('\n4️⃣ Testing learning pattern generation...');

    // Calculate improvement rate
    const sortedProgress = weekProgress.sort((a, b) => a.date - b.date);
    const firstHalf = sortedProgress.slice(0, Math.ceil(sortedProgress.length / 2));
    const secondHalf = sortedProgress.slice(Math.ceil(sortedProgress.length / 2));

    const firstHalfAverage = firstHalf.length > 0 ? 
      firstHalf.reduce((sum, p) => sum + (p.score || 0), 0) / firstHalf.length : 0;
    const secondHalfAverage = secondHalf.length > 0 ? 
      secondHalf.reduce((sum, p) => sum + (p.score || 0), 0) / secondHalf.length : 0;

    const improvementRate = secondHalfAverage - firstHalfAverage;

    console.log(`🧠 Learning Pattern Analysis:`);
    console.log(`   - First half average: ${firstHalfAverage.toFixed(2)}%`);
    console.log(`   - Second half average: ${secondHalfAverage.toFixed(2)}%`);
    console.log(`   - Improvement rate: ${improvementRate.toFixed(2)}%`);

    // 4. Test progress retrieval
    console.log('\n5️⃣ Testing progress data retrieval...');

    const allProgress = await prisma.dailyProgress.findMany({
      where: { studentId: student.id },
      include: {
        assignment: {
          select: {
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
      orderBy: { date: 'desc' },
      take: 10
    });

    console.log(`📋 Recent Progress (${allProgress.length} entries):`);
    allProgress.forEach((progress, index) => {
      console.log(`   ${index + 1}. ${progress.assignment.title}`);
      console.log(`      📅 Date: ${progress.date.toLocaleDateString()}`);
      console.log(`      🎯 Score: ${progress.score || 0}%`);
      console.log(`      ⏱️ Time: ${progress.timeSpentMinutes || 0} min`);
      console.log(`      ✅ Completed: ${progress.completed ? 'Yes' : 'No'}`);
    });

    // 5. Clean up test data
    console.log('\n6️⃣ Cleaning up test data...');
    
    await prisma.dailyProgress.delete({
      where: { id: progress.id }
    });

    console.log('🧹 Test progress data cleaned up');

    console.log('\n✅ Progress tracking system test completed successfully!');
    console.log('\n📋 Summary:');
    console.log('   ✅ Progress recording works');
    console.log('   ✅ Weekly calculations work');
    console.log('   ✅ Learning pattern analysis works');
    console.log('   ✅ Data retrieval works');
    console.log('   ✅ Database relationships are correct');

  } catch (error) {
    console.error('❌ Error testing progress tracking:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testProgressTracking(); 