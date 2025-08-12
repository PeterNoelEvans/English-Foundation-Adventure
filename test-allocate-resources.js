const axios = require('axios');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const BASE_URL = 'http://localhost:3000/api';

async function testAllocateResources() {
  console.log('🧪 Testing Resource Allocation Functionality...\n');

  try {
    // 1. Test the backend route directly
    console.log('1️⃣ Testing backend route /assignments/resources...');
    
    // First, let's get some assignments and resources
    const assignments = await prisma.assessment.findMany({
      take: 1,
      include: {
        course: true,
        unit: true
      }
    });

    const resources = await prisma.resource.findMany({
      take: 1
    });

    if (assignments.length === 0) {
      console.log('❌ No assignments found');
      return;
    }

    if (resources.length === 0) {
      console.log('❌ No resources found');
      return;
    }

    const assignment = assignments[0];
    const resource = resources[0];

    console.log(`📋 Assignment: ${assignment.title}`);
    console.log(`   - Course: ${assignment.course?.name || 'No Course'}`);
    console.log(`   - Unit: ${assignment.unit?.name || 'No Unit'}`);
    console.log(`📁 Resource: ${resource.title}`);
    console.log(`   - Type: ${resource.type}`);

    // Test the allocation
    const allocationData = {
      assignmentId: assignment.id,
      resourceIds: [resource.id]
    };

    console.log('\n2️⃣ Testing allocation with data:', allocationData);

    // Note: This would require authentication, so we'll test the database directly
    console.log('\n3️⃣ Testing database allocation directly...');
    
    const updatedAssignment = await prisma.assessment.update({
      where: { id: assignment.id },
      data: {
        resources: {
          connect: [{ id: resource.id }]
        }
      },
      include: {
        resources: true,
        course: true,
        unit: true
      }
    });

    console.log('✅ Allocation successful!');
    console.log(`📋 Updated assignment: ${updatedAssignment.title}`);
    console.log(`   - Course: ${updatedAssignment.course?.name || 'No Course'}`);
    console.log(`   - Unit: ${updatedAssignment.unit?.name || 'No Unit'}`);
    console.log(`   - Resources: ${updatedAssignment.resources.length}`);

    // Clean up - remove the resource
    await prisma.assessment.update({
      where: { id: assignment.id },
      data: {
        resources: {
          disconnect: [{ id: resource.id }]
        }
      }
    });

    console.log('\n🧹 Cleaned up test allocation');

  } catch (error) {
    console.error('❌ Error testing allocation:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testAllocateResources(); 