const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testBackendQuery() {
  console.log('🔍 Testing Backend Query Logic...\n');
  
  try {
    // Simulate the student data
    const studentId = '7d285ec5-5726-44ba-bdd4-97e95526feed';
    
    // Get student data (like the backend does)
    const student = await prisma.user.findUnique({
      where: { id: studentId },
      select: { 
        organizationId: true,
        studentCourses: {
          select: { courseId: true }
        }
      }
    });
    
    console.log('Student organizationId:', student.organizationId);
    console.log('Student enrollments:', student.studentCourses.map(sc => sc.courseId));
    
    // Get enrolled course IDs
    const enrolledCourseIds = student.studentCourses.map(sc => sc.courseId);
    
    if (enrolledCourseIds.length === 0) {
      console.log('❌ Student is not enrolled in any courses');
      return;
    }
    
    // Test the EXACT backend query
    console.log('\nTesting exact backend query...');
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
    
    console.log(`\nBackend query found ${assignments.length} assignments:`);
    assignments.forEach(assignment => {
      console.log(`- ${assignment.title} (Course: ${assignment.course.name})`);
      console.log(`  Available From: ${assignment.availableFrom}`);
      console.log(`  Available To: ${assignment.availableTo}`);
      console.log(`  Published: ${assignment.published}`);
    });
    
    // Test each condition separately
    console.log('\n🔍 Testing each condition separately:');
    
    // Condition 1: availableFrom <= now AND availableTo >= now
    const condition1 = await prisma.assessment.findMany({
      where: {
        courseId: { in: enrolledCourseIds },
        published: true,
        course: {
          subject: {
            organizationId: student.organizationId
          }
        },
        availableFrom: {
          lte: new Date()
        },
        availableTo: {
          gte: new Date()
        }
      }
    });
    console.log(`Condition 1 (availableFrom <= now AND availableTo >= now): ${condition1.length} assignments`);
    
    // Condition 2: availableFrom <= now AND availableTo is null
    const condition2 = await prisma.assessment.findMany({
      where: {
        courseId: { in: enrolledCourseIds },
        published: true,
        course: {
          subject: {
            organizationId: student.organizationId
          }
        },
        availableFrom: {
          lte: new Date()
        },
        availableTo: null
      }
    });
    console.log(`Condition 2 (availableFrom <= now AND availableTo is null): ${condition2.length} assignments`);
    
    // Condition 3: availableFrom is null AND availableTo >= now
    const condition3 = await prisma.assessment.findMany({
      where: {
        courseId: { in: enrolledCourseIds },
        published: true,
        course: {
          subject: {
            organizationId: student.organizationId
          }
        },
        availableFrom: null,
        availableTo: {
          gte: new Date()
        }
      }
    });
    console.log(`Condition 3 (availableFrom is null AND availableTo >= now): ${condition3.length} assignments`);
    
    // Condition 4: availableFrom is null AND availableTo is null
    const condition4 = await prisma.assessment.findMany({
      where: {
        courseId: { in: enrolledCourseIds },
        published: true,
        course: {
          subject: {
            organizationId: student.organizationId
          }
        },
        availableFrom: null,
        availableTo: null
      }
    });
    console.log(`Condition 4 (availableFrom is null AND availableTo is null): ${condition4.length} assignments`);
    
    // Test without organization filter
    console.log('\n🔍 Testing without organization filter:');
    const assignmentsNoOrg = await prisma.assessment.findMany({
      where: {
        courseId: { in: enrolledCourseIds },
        published: true,
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
      }
    });
    console.log(`Without organization filter: ${assignmentsNoOrg.length} assignments`);
    
    // Test without date filter
    console.log('\n🔍 Testing without date filter:');
    const assignmentsNoDate = await prisma.assessment.findMany({
      where: {
        courseId: { in: enrolledCourseIds },
        published: true,
        course: {
          subject: {
            organizationId: student.organizationId
          }
        }
      }
    });
    console.log(`Without date filter: ${assignmentsNoDate.length} assignments`);
    
    return assignments;
    
  } catch (error) {
    console.error('❌ Error testing backend query:', error);
    return [];
  } finally {
    await prisma.$disconnect();
  }
}

// Run test if this file is executed directly
if (require.main === module) {
  testBackendQuery().catch(console.error);
}

module.exports = {
  testBackendQuery
}; 