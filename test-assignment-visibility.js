const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testAssignmentVisibilityLogic() {
  console.log('🔍 Testing Assignment Visibility Logic...\n');
  
  try {
    // Get the student and their enrollments
    const student = await prisma.user.findUnique({
      where: { id: '7d285ec5-5726-44ba-bdd4-97e95526feed' },
      select: { 
        organizationId: true,
        studentCourses: {
          select: { courseId: true }
        }
      }
    });
    
    console.log('Student enrollments:', student.studentCourses.map(sc => sc.courseId));
    
    // Get all assignments for the student's enrolled courses
    const enrolledCourseIds = student.studentCourses.map(sc => sc.courseId);
    
    console.log('Enrolled course IDs:', enrolledCourseIds);
    
    if (enrolledCourseIds.length === 0) {
      console.log('❌ Student is not enrolled in any courses');
      return;
    }
    
    // Test the exact query that the backend uses
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
        }
      }
    });
    
    console.log(`\n📋 Found ${assignments.length} assignments for student:`);
    assignments.forEach(assignment => {
      console.log(`- ${assignment.title} (Course: ${assignment.course.name})`);
      console.log(`  Available From: ${assignment.availableFrom}`);
      console.log(`  Available To: ${assignment.availableTo}`);
      console.log(`  Published: ${assignment.published}`);
    });
    
    // Also check all assignments in the system
    const allAssignments = await prisma.assessment.findMany({
      where: {
        published: true
      },
      include: {
        course: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });
    
    console.log(`\n📋 All published assignments in system (${allAssignments.length}):`);
    allAssignments.forEach(assignment => {
      const isEnrolled = enrolledCourseIds.includes(assignment.courseId);
      console.log(`- ${assignment.title} (Course: ${assignment.course.name}) - Enrolled: ${isEnrolled ? 'YES' : 'NO'}`);
      console.log(`  Available From: ${assignment.availableFrom}`);
      console.log(`  Available To: ${assignment.availableTo}`);
    });
    
    // Check if there are any assignments with null availability dates
    const assignmentsWithNullDates = await prisma.assessment.findMany({
      where: {
        courseId: { in: enrolledCourseIds },
        published: true,
        availableFrom: null,
        availableTo: null
      }
    });
    
    console.log(`\n📋 Assignments with null availability dates: ${assignmentsWithNullDates.length}`);
    assignmentsWithNullDates.forEach(assignment => {
      console.log(`- ${assignment.title}`);
    });
    
    // Check current date for debugging
    const now = new Date();
    console.log(`\n🕐 Current date/time: ${now.toISOString()}`);
    
    // Test each availability condition
    console.log('\n🔍 Testing availability conditions:');
    
    // Condition 1: availableFrom <= now AND availableTo >= now
    const condition1 = await prisma.assessment.findMany({
      where: {
        courseId: { in: enrolledCourseIds },
        published: true,
        availableFrom: { lte: now },
        availableTo: { gte: now }
      }
    });
    console.log(`Condition 1 (availableFrom <= now AND availableTo >= now): ${condition1.length} assignments`);
    
    // Condition 2: availableFrom <= now AND availableTo is null
    const condition2 = await prisma.assessment.findMany({
      where: {
        courseId: { in: enrolledCourseIds },
        published: true,
        availableFrom: { lte: now },
        availableTo: null
      }
    });
    console.log(`Condition 2 (availableFrom <= now AND availableTo is null): ${condition2.length} assignments`);
    
    // Condition 3: availableFrom is null AND availableTo >= now
    const condition3 = await prisma.assessment.findMany({
      where: {
        courseId: { in: enrolledCourseIds },
        published: true,
        availableFrom: null,
        availableTo: { gte: now }
      }
    });
    console.log(`Condition 3 (availableFrom is null AND availableTo >= now): ${condition3.length} assignments`);
    
    // Condition 4: availableFrom is null AND availableTo is null
    const condition4 = await prisma.assessment.findMany({
      where: {
        courseId: { in: enrolledCourseIds },
        published: true,
        availableFrom: null,
        availableTo: null
      }
    });
    console.log(`Condition 4 (availableFrom is null AND availableTo is null): ${condition4.length} assignments`);
    
    return assignments;
    
  } catch (error) {
    console.error('❌ Error testing assignment visibility:', error);
    return [];
  }
}

async function createTestAssignmentForStudent() {
  console.log('\n📝 Creating test assignment for student...');
  
  try {
    // Get the course the student is enrolled in
    const studentCourse = await prisma.studentCourse.findFirst({
      where: { studentId: '7d285ec5-5726-44ba-bdd4-97e95526feed' },
      include: { course: true }
    });
    
    if (!studentCourse) {
      console.log('❌ Student is not enrolled in any courses');
      return null;
    }
    
    console.log(`Student is enrolled in: ${studentCourse.course.name}`);
    
    // Create a test assignment for this course
    const testAssignment = await prisma.assessment.create({
      data: {
        title: 'Test Assignment for Student',
        description: 'This assignment should be visible to the student',
        type: 'multiple-choice',
        published: true,
        availableFrom: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
        availableTo: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
        questions: {
          type: 'multiple-choice',
          question: 'What is 2 + 2?',
          options: ['3', '4', '5', '6'],
          correctAnswer: '4',
          correctAnswerIndex: 1,
          explanation: '2 + 2 equals 4'
        },
        createdById: 'b1432721-9cf9-4374-96c6-07d8e403e23d', // Teacher ID
        courseId: studentCourse.courseId
      }
    });
    
    console.log('✅ Test assignment created:', testAssignment.id);
    return testAssignment;
    
  } catch (error) {
    console.error('❌ Error creating test assignment:', error);
    return null;
  }
}

async function cleanupTestAssignment(assignmentId) {
  if (assignmentId) {
    try {
      await prisma.assessment.delete({
        where: { id: assignmentId }
      });
      console.log('✅ Test assignment cleaned up');
    } catch (error) {
      console.error('❌ Error cleaning up test assignment:', error);
    }
  }
}

// Main test runner
async function runAssignmentVisibilityTests() {
  console.log('🧪 Starting Assignment Visibility Tests...\n');
  
  let testAssignmentId = null;
  
  try {
    // Test 1: Check current visibility
    console.log('='.repeat(50));
    console.log('TEST 1: Current Assignment Visibility');
    console.log('='.repeat(50));
    const currentAssignments = await testAssignmentVisibilityLogic();
    
    // Test 2: Create test assignment
    console.log('\n' + '='.repeat(50));
    console.log('TEST 2: Create Test Assignment');
    console.log('='.repeat(50));
    const testAssignment = await createTestAssignmentForStudent();
    if (testAssignment) {
      testAssignmentId = testAssignment.id;
    }
    
    // Test 3: Check visibility after creating test assignment
    if (testAssignmentId) {
      console.log('\n' + '='.repeat(50));
      console.log('TEST 3: Visibility After Creating Test Assignment');
      console.log('='.repeat(50));
      await testAssignmentVisibilityLogic();
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('SUMMARY');
    console.log('='.repeat(50));
    
    if (currentAssignments.length === 0) {
      console.log('❌ No assignments are currently visible to the student');
      console.log('Possible reasons:');
      console.log('1. Student is not enrolled in any courses');
      console.log('2. No assignments exist for enrolled courses');
      console.log('3. Assignments are not published');
      console.log('4. Assignments are outside availability window');
      console.log('5. Assignments belong to different organization');
    } else {
      console.log(`✅ ${currentAssignments.length} assignments are visible to the student`);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    // Cleanup
    await cleanupTestAssignment(testAssignmentId);
    await prisma.$disconnect();
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAssignmentVisibilityTests().catch(console.error);
}

module.exports = {
  runAssignmentVisibilityTests,
  testAssignmentVisibilityLogic
}; 