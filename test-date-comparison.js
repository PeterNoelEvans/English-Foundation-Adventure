const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testDateComparison() {
  console.log('🔍 Testing Date Comparison...\n');
  
  try {
    const now = new Date();
    console.log('JavaScript Date.now():', now.toISOString());
    console.log('JavaScript Date.toString():', now.toString());
    
    // Get the assignment
    const assignment = await prisma.assessment.findFirst({
      where: { title: 'test' },
      select: {
        id: true,
        title: true,
        availableFrom: true,
        availableTo: true,
        published: true
      }
    });
    
    if (!assignment) {
      console.log('❌ Assignment "test" not found');
      return;
    }
    
    console.log('\nAssignment details:');
    console.log('Title:', assignment.title);
    console.log('Available From:', assignment.availableFrom);
    console.log('Available To:', assignment.availableTo);
    console.log('Published:', assignment.published);
    
    // Test the comparison
    console.log('\nDate comparisons:');
    console.log('availableFrom <= now:', assignment.availableFrom <= now);
    console.log('availableTo >= now:', assignment.availableTo >= now);
    console.log('availableFrom <= now (ISO):', assignment.availableFrom.toISOString() <= now.toISOString());
    console.log('availableTo >= now (ISO):', assignment.availableTo.toISOString() >= now.toISOString());
    
    // Test the exact Prisma query
    console.log('\nTesting Prisma query...');
    const result = await prisma.assessment.findMany({
      where: {
        title: 'test',
        published: true,
        OR: [
          {
            availableFrom: null,
            availableTo: null
          },
          {
            availableFrom: {
              lte: now
            },
            availableTo: null
          },
          {
            availableFrom: null,
            availableTo: {
              gte: now
            }
          },
          {
            availableFrom: {
              lte: now
            },
            availableTo: {
              gte: now
            }
          }
        ]
      }
    });
    
    console.log('Prisma query result count:', result.length);
    if (result.length > 0) {
      console.log('✅ Assignment found by Prisma query');
    } else {
      console.log('❌ Assignment NOT found by Prisma query');
    }
    
    // Test with a simpler query
    console.log('\nTesting simpler query...');
    const simpleResult = await prisma.assessment.findMany({
      where: {
        title: 'test',
        published: true,
        availableFrom: {
          lte: now
        },
        availableTo: {
          gte: now
        }
      }
    });
    
    console.log('Simple query result count:', simpleResult.length);
    if (simpleResult.length > 0) {
      console.log('✅ Assignment found by simple query');
    } else {
      console.log('❌ Assignment NOT found by simple query');
    }
    
  } catch (error) {
    console.error('❌ Error testing date comparison:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run test if this file is executed directly
if (require.main === module) {
  testDateComparison().catch(console.error);
}

module.exports = {
  testDateComparison
}; 