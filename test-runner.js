const { runTests: runAssignmentTests } = require('./test-assignment-availability');
const { runDatabaseRelationshipTests } = require('./test-database-relationships');

async function runAllTests() {
  console.log('🚀 Starting Comprehensive Test Suite...\n');
  
  const testSuites = [
    {
      name: 'Database Relationship Tests',
      fn: runDatabaseRelationshipTests,
      description: 'Tests database schema integrity and relationship queries'
    },
    {
      name: 'Assignment Availability Tests',
      fn: runAssignmentTests,
      description: 'Tests assignment creation, availability filtering, and editing'
    }
  ];
  
  let passedSuites = 0;
  let totalSuites = testSuites.length;
  
  for (const suite of testSuites) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🧪 TEST SUITE: ${suite.name}`);
    console.log(`📝 Description: ${suite.description}`);
    console.log(`${'='.repeat(60)}`);
    
    try {
      await suite.fn();
      passedSuites++;
      console.log(`\n✅ ${suite.name}: PASSED`);
    } catch (error) {
      console.log(`\n❌ ${suite.name}: FAILED`);
      console.error('Error:', error.message);
    }
  }
  
  // Final results
  console.log(`\n${'='.repeat(60)}`);
  console.log('🎯 COMPREHENSIVE TEST RESULTS');
  console.log(`${'='.repeat(60)}`);
  console.log(`Passed Suites: ${passedSuites}/${totalSuites}`);
  console.log(`Failed Suites: ${totalSuites - passedSuites}/${totalSuites}`);
  
  if (passedSuites === totalSuites) {
    console.log('\n🎉 ALL TEST SUITES PASSED!');
    console.log('✅ Your application is working correctly');
    console.log('✅ Database relationships are properly configured');
    console.log('✅ Assignment availability feature is fully functional');
    console.log('✅ All error conditions are properly handled');
  } else {
    console.log('\n⚠️ Some test suites failed.');
    console.log('🔧 Please check the logs above and fix any issues.');
  }
  
  console.log('\n📋 Test Coverage Summary:');
  console.log('   • Database schema validation');
  console.log('   • Relationship integrity checks');
  console.log('   • Invalid field access prevention');
  console.log('   • Assignment creation and editing');
  console.log('   • Availability date filtering');
  console.log('   • Publishing and visibility controls');
  console.log('   • Error handling and validation');
}

// Run all tests if this file is executed directly
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = {
  runAllTests
}; 