const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function deleteAllAssignments() {
  try {
    console.log('Deleting all test assignments...');
    
    // First, let's see how many assignments we have
    const count = await prisma.assessment.count();
    console.log(`Found ${count} assignments in the database`);
    
    // Delete all assignments
    const result = await prisma.assessment.deleteMany({});
    console.log(`Successfully deleted ${result.count} assignments`);
    
  } catch (error) {
    console.error('Error deleting assignments:', error);
  } finally {
    await prisma.$disconnect();
  }
}

deleteAllAssignments(); 