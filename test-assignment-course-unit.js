const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testAssignmentCourseUnit() {
  console.log('🧪 Testing Assignment Course/Unit Assignment...\n');

  try {
    // Get all assignments with course and unit info
    const assignments = await prisma.assessment.findMany({
      include: {
        course: {
          include: {
            subject: true
          }
        },
        unit: true,
        createdBy: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log(`📋 Found ${assignments.length} assignments:\n`);

    assignments.forEach((assignment, index) => {
      console.log(`${index + 1}. ${assignment.title}`);
      console.log(`   👤 Created by: ${assignment.createdBy.firstName} ${assignment.createdBy.lastName}`);
      console.log(`   📚 Course: ${assignment.course?.name || 'No Course'} (${assignment.course?.subject?.name || 'No Subject'})`);
      console.log(`   📖 Unit: ${assignment.unit?.name || 'No Unit'} (Order: ${assignment.unit?.order || 'N/A'})`);
      console.log(`   🏢 Organization: ${assignment.course?.subject?.organizationId || 'N/A'}`);
      console.log(`   📅 Created: ${assignment.createdAt.toLocaleDateString()}`);
      console.log(`   🔗 Course ID: ${assignment.courseId || 'null'}`);
      console.log(`   🔗 Unit ID: ${assignment.unitId || 'null'}`);
      console.log('');
    });

    // Check if there are any courses and units
    const courses = await prisma.course.findMany({
      include: {
        subject: true,
        units: {
          orderBy: {
            order: 'asc'
          }
        }
      }
    });

    console.log(`📚 Available Courses (${courses.length}):`);
    courses.forEach(course => {
      console.log(`   - ${course.name} (${course.subject.name})`);
      console.log(`     Units: ${course.units.map(u => `${u.order}: ${u.name}`).join(', ')}`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testAssignmentCourseUnit(); 