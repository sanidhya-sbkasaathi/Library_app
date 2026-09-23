import { serverCrypto } from '../Library-Management-Server/src/utils/serverCrypto.ts';
import { appCrypto } from './src/utils/appCrypto.ts';
import { runAllTamperTests } from './src/utils/cryptoTamperTests.ts';

async function main() {
  console.log('--- RUNNING 15-POINT CRYPTOGRAPHIC TAMPERING TEST SUITE ---');
  
  const issueOwner = async () => {
    return await serverCrypto.issueOwnerCredential({
      libraryId: 'ORG-ABC001',
      ownerName: 'Rahul Kumar',
      ownerEmail: 'owner@abclibrary.in',
      plan: 'Professional',
      durationYears: 1,
    });
  };

  const issueRole = async () => {
    return await serverCrypto.issueRoleCredential({
      libraryId: 'ORG-ABC001',
      role: 'Librarian',
      userName: 'Priya Sharma',
      userEmail: 'priya@abclibrary.in',
      validDays: 365,
    });
  };

  const result = await runAllTamperTests(issueOwner, issueRole);

  console.log(`\nTEST RUN RESULTS: ${result.passedCount}/${result.totalTests} Passed (All Passed: ${result.allPassed})\n`);
  
  for (const r of result.results) {
    const status = r.passed ? '✓ PASS' : '✗ FAIL';
    console.log(`[Test ${r.id.toString().padStart(2, '0')}] ${status} | Expected: ${r.expected} | Actual: ${r.actual} | ${r.name}`);
    console.log(`          Details: ${r.details} (${r.executionTimeMs}ms)`);
  }

  if (!result.allPassed) {
    console.error('ERROR: One or more tamper tests failed!');
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Test execution error:', err);
  process.exit(1);
});
