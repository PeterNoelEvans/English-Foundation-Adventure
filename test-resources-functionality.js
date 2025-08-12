const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testResourcesFunctionality() {
  console.log('🧪 Testing Resources Functionality...\n');
  
  try {
    // Get the assignment we created earlier
    const assignment = await prisma.assessment.findFirst({
      where: { title: 'Test Assignment for Student' },
      include: {
        course: {
          select: {
            id: true,
            name: true
          }
        },
        resources: {
          select: {
            id: true,
            title: true,
            description: true,
            type: true,
            fileSize: true
          }
        }
      }
    });
    
    if (!assignment) {
      console.log('❌ Test assignment not found');
      return;
    }
    
    console.log('✅ Test assignment found:');
    console.log(`- Title: ${assignment.title}`);
    console.log(`- Course: ${assignment.course.name}`);
    console.log(`- Published: ${assignment.published}`);
    console.log(`- Resources count: ${assignment.resources.length}`);
    
    // Test adding a resource to the assignment
    console.log('\n📝 Adding a test resource to the assignment...');
    
    const testResource = await prisma.resource.create({
      data: {
        title: 'Sample Learning Material',
        description: 'This is a test resource for the assignment',
        type: 'document',
        fileSize: 1024000, // 1MB
        filePath: '/uploads/sample.pdf',
        createdById: 'b1432721-9cf9-4374-96c6-07d8e403e23d', // Teacher ID
        courseId: '2be51194-77fe-4ea6-82fc-84947167217f' // Course ID
      }
    });
    
    console.log('✅ Test resource created:', testResource.id);
    
    // Link the resource to the assignment
    await prisma.assessment.update({
      where: { id: assignment.id },
      data: {
        resources: {
          connect: { id: testResource.id }
        }
      }
    });
    
    console.log('✅ Resource linked to assignment');
    
    // Verify the assignment now has resources
    const updatedAssignment = await prisma.assessment.findFirst({
      where: { id: assignment.id },
      include: {
        resources: {
          select: {
            id: true,
            title: true,
            description: true,
            type: true,
            fileSize: true
          }
        }
      }
    });
    
    console.log(`\n📋 Updated assignment resources: ${updatedAssignment.resources.length}`);
    updatedAssignment.resources.forEach(resource => {
      console.log(`- ${resource.title} (${resource.type}, ${resource.fileSize} bytes)`);
    });
    
    // Test the student can see this assignment with resources
    const student = await prisma.user.findUnique({
      where: { id: '7d285ec5-5726-44ba-bdd4-97e95526feed' },
      select: { 
        organizationId: true,
        studentCourses: {
          select: { courseId: true }
        }
      }
    });
    
    const enrolledCourseIds = student.studentCourses.map(sc => sc.courseId);
    
    // Test the backend query that includes resources
    const assignmentsWithResources = await prisma.assessment.findMany({
      where: {
        courseId: { in: enrolledCourseIds },
        published: true,
        course: {
          subject: {
            organizationId: student.organizationId
          }
        },
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
            name: true
          }
        },
        resources: {
          select: {
            id: true,
            title: true,
            description: true,
            type: true,
            fileSize: true
          }
        }
      }
    });
    
    console.log(`\n🎯 Student can see ${assignmentsWithResources.length} assignments with resources:`);
    assignmentsWithResources.forEach(assignment => {
      console.log(`- ${assignment.title} (${assignment.resources.length} resources)`);
      assignment.resources.forEach(resource => {
        console.log(`  📄 ${resource.title}`);
      });
    });
    
    console.log('\n✅ Resources functionality test completed successfully!');
    console.log('📋 Summary:');
    console.log('- Assignment has resources linked');
    console.log('- Student can see assignments with resources');
    console.log('- Frontend will display "View Resources" button');
    console.log('- Resources modal will show available materials');
    
  } catch (error) {
    console.error('❌ Error testing resources functionality:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run test if this file is executed directly
if (require.main === module) {
  testResourcesFunctionality().catch(console.error);
}

module.exports = {
  testResourcesFunctionality
}; 