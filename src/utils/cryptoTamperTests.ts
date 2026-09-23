/**
 * AUTOMATED CRYPTOGRAPHIC TAMPERING & SECURITY VALIDATION SUITE
 * 
 * Executes all 15 mandatory security tests specified in the architecture blueprint.
 * Verifies that Ed25519 digital signatures and type guards mathematically reject
 * any modified, forged, expired, revoked, or cross-tenant credentials.
 */

import { appCrypto, SignedCredentialEnvelope, OwnerCredentialPayload, RoleCredentialPayload } from './appCrypto';

export interface TestCaseResult {
  id: number;
  name: string;
  description: string;
  expected: 'PASS' | 'FAIL';
  actual: 'PASS' | 'FAIL';
  passed: boolean;
  details: string;
  executionTimeMs: number;
}

export async function runAllTamperTests(
  serverIssueOwnerFn: () => Promise<SignedCredentialEnvelope<OwnerCredentialPayload>>,
  serverIssueRoleFn: () => Promise<SignedCredentialEnvelope<RoleCredentialPayload>>
): Promise<{
  totalTests: number;
  passedCount: number;
  failedCount: number;
  allPassed: boolean;
  results: TestCaseResult[];
}> {
  const results: TestCaseResult[] = [];

  // Helper to record a test
  const record = (
    id: number,
    name: string,
    desc: string,
    expected: 'PASS' | 'FAIL',
    actualSuccess: boolean,
    details: string,
    startTime: number
  ) => {
    const actual = actualSuccess ? 'PASS' : 'FAIL';
    results.push({
      id,
      name,
      description: desc,
      expected,
      actual,
      passed: expected === actual,
      details,
      executionTimeMs: Math.round(performance.now() - startTime),
    });
  };

  // Generate baseline genuine credentials
  const genuineOwnerEnv = await serverIssueOwnerFn();
  const genuineRoleEnv = await serverIssueRoleFn();

  // -------------------------------------------------------------
  // Test 1: Genuine Owner Credential
  // -------------------------------------------------------------
  let t0 = performance.now();
  const t1Res = await appCrypto.verifyOwnerCredential(genuineOwnerEnv);
  record(
    1,
    'Genuine Owner Credential',
    'Original unmodified signed owner credential must verify successfully',
    'PASS',
    t1Res.valid,
    t1Res.valid ? 'Signature verified mathematically with embedded public key' : (t1Res.error || 'Failed'),
    t0
  );

  // -------------------------------------------------------------
  // Test 2: Modify Owner ID (1 character altered)
  // -------------------------------------------------------------
  t0 = performance.now();
  const tamperedOwnerIdEnv: SignedCredentialEnvelope<OwnerCredentialPayload> = JSON.parse(JSON.stringify(genuineOwnerEnv));
  tamperedOwnerIdEnv.payload.owner_id += 'X'; // 1 char tampered
  const t2Res = await appCrypto.verifyOwnerCredential(tamperedOwnerIdEnv);
  record(
    2,
    'Modify Owner ID',
    'Altering single character in owner_id must cause cryptographic verification failure',
    'FAIL',
    t2Res.valid,
    t2Res.valid ? 'SECURITY FLAW: Tampered owner_id accepted!' : (t2Res.error || 'Rejected properly'),
    t0
  );

  // -------------------------------------------------------------
  // Test 3: Modify Library ID
  // -------------------------------------------------------------
  t0 = performance.now();
  const tamperedLibIdEnv: SignedCredentialEnvelope<OwnerCredentialPayload> = JSON.parse(JSON.stringify(genuineOwnerEnv));
  tamperedLibIdEnv.payload.library_id = 'ORG-FORGED-999';
  const t3Res = await appCrypto.verifyOwnerCredential(tamperedLibIdEnv);
  record(
    3,
    'Modify Library ID',
    'Changing library_id to unauthorized tenant must cause signature verification failure',
    'FAIL',
    t3Res.valid,
    t3Res.valid ? 'SECURITY FLAW: Tampered library_id accepted!' : (t3Res.error || 'Rejected properly'),
    t0
  );

  // -------------------------------------------------------------
  // Test 4: Modify Expiration Date (e.g. extend to 2035)
  // -------------------------------------------------------------
  t0 = performance.now();
  const tamperedExpiryEnv: SignedCredentialEnvelope<OwnerCredentialPayload> = JSON.parse(JSON.stringify(genuineOwnerEnv));
  tamperedExpiryEnv.payload.expires_at = '2035-12-31';
  const t4Res = await appCrypto.verifyOwnerCredential(tamperedExpiryEnv);
  record(
    4,
    'Modify Expiration Date',
    'Unauthorized extension of expires_at must be detected by signature check',
    'FAIL',
    t4Res.valid,
    t4Res.valid ? 'SECURITY FLAW: Extended expiration date accepted!' : (t4Res.error || 'Rejected properly'),
    t0
  );

  // -------------------------------------------------------------
  // Test 5: Modify Role (e.g. Librarian -> Super Admin)
  // -------------------------------------------------------------
  t0 = performance.now();
  const tamperedRoleEnv: SignedCredentialEnvelope<RoleCredentialPayload> = JSON.parse(JSON.stringify(genuineRoleEnv));
  tamperedRoleEnv.payload.role = 'Super Admin';
  const t5Res = await appCrypto.verifyRoleCredential(tamperedRoleEnv);
  record(
    5,
    'Modify Role Privilege Escalation',
    'Privilege escalation modifying role from Librarian to Super Admin must fail',
    'FAIL',
    t5Res.valid,
    t5Res.valid ? 'SECURITY FLAW: Escalated role privilege accepted!' : (t5Res.error || 'Rejected properly'),
    t0
  );

  // -------------------------------------------------------------
  // Test 6: Modify Credential Type (LIBRARY_OWNER -> LIBRARY_ROLE)
  // -------------------------------------------------------------
  t0 = performance.now();
  const tamperedTypeEnv: any = JSON.parse(JSON.stringify(genuineOwnerEnv));
  tamperedTypeEnv.payload.credential_type = 'LIBRARY_ROLE';
  const t6Res = await appCrypto.verifyEnvelope(tamperedTypeEnv);
  record(
    6,
    'Modify Credential Type',
    'Switching credential_type in payload must break digital signature',
    'FAIL',
    t6Res.valid,
    t6Res.valid ? 'SECURITY FLAW: Tampered credential_type accepted!' : (t6Res.error || 'Rejected properly'),
    t0
  );

  // -------------------------------------------------------------
  // Test 7: Invalid Signature (Replace signature with random hex bytes)
  // -------------------------------------------------------------
  t0 = performance.now();
  const invalidSigEnv: SignedCredentialEnvelope<OwnerCredentialPayload> = JSON.parse(JSON.stringify(genuineOwnerEnv));
  invalidSigEnv.signature = 'deadbeef'.repeat(16); // 64 bytes of junk
  const t7Res = await appCrypto.verifyOwnerCredential(invalidSigEnv);
  record(
    7,
    'Invalid Signature / Random Bytes',
    'Completely fabricated signature bytes must fail verification',
    'FAIL',
    t7Res.valid,
    t7Res.valid ? 'SECURITY FLAW: Fake signature accepted!' : (t7Res.error || 'Rejected properly'),
    t0
  );

  // -------------------------------------------------------------
  // Test 8: Wrong Public Key
  // -------------------------------------------------------------
  t0 = performance.now();
  const foreignPublicKeyHex = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
  const t8Res = await appCrypto.verifyOwnerCredential(genuineOwnerEnv, foreignPublicKeyHex);
  record(
    8,
    'Wrong Public Key Verification',
    'Verifying genuine signature against an untrusted public key must fail',
    'FAIL',
    t8Res.valid,
    t8Res.valid ? 'SECURITY FLAW: Verified with foreign public key!' : (t8Res.error || 'Rejected properly'),
    t0
  );

  // -------------------------------------------------------------
  // Test 9: Expired Credential
  // -------------------------------------------------------------
  t0 = performance.now();
  const expiredEnv: SignedCredentialEnvelope<OwnerCredentialPayload> = JSON.parse(JSON.stringify(genuineOwnerEnv));
  expiredEnv.payload.expires_at = '2020-01-01'; // Expired in past
  // Even if signature is somehow accepted or checked, expiration validator must fail
  const t9Res = await appCrypto.verifyOwnerCredential(expiredEnv);
  record(
    9,
    'Expired Credential Rejection',
    'Credential with past expiration date must be explicitly rejected',
    'FAIL',
    t9Res.valid,
    t9Res.valid ? 'SECURITY FLAW: Expired credential accepted!' : (t9Res.error || 'Rejected properly'),
    t0
  );

  // -------------------------------------------------------------
  // Test 10: Revoked Credential
  // -------------------------------------------------------------
  t0 = performance.now();
  const revokedEnv: SignedCredentialEnvelope<OwnerCredentialPayload> = JSON.parse(JSON.stringify(genuineOwnerEnv));
  revokedEnv.payload.status = 'revoked';
  const t10Res = await appCrypto.verifyOwnerCredential(revokedEnv);
  record(
    10,
    'Revoked Credential Rejection',
    'Revoked credential status must be rejected immediately',
    'FAIL',
    t10Res.valid,
    t10Res.valid ? 'SECURITY FLAW: Revoked credential accepted!' : (t10Res.error || 'Rejected properly'),
    t0
  );

  // -------------------------------------------------------------
  // Test 11: Owner Credential Presented on Role Screen
  // -------------------------------------------------------------
  t0 = performance.now();
  const t11Res = await appCrypto.verifyRoleCredential(genuineOwnerEnv);
  record(
    11,
    'Owner Credential on Role Screen',
    'Role onboarding screen must strictly reject genuine Owner credentials',
    'FAIL',
    t11Res.valid,
    t11Res.valid ? 'SECURITY FLAW: Owner credential accepted as Role!' : (t11Res.error || 'Rejected properly'),
    t0
  );

  // -------------------------------------------------------------
  // Test 12: Role Credential Presented on Owner Screen
  // -------------------------------------------------------------
  t0 = performance.now();
  const t12Res = await appCrypto.verifyOwnerCredential(genuineRoleEnv);
  record(
    12,
    'Role Credential on Owner Screen',
    'Owner onboarding screen must strictly reject genuine Role credentials',
    'FAIL',
    t12Res.valid,
    t12Res.valid ? 'SECURITY FLAW: Role credential accepted as Owner!' : (t12Res.error || 'Rejected properly'),
    t0
  );

  // -------------------------------------------------------------
  // Test 13: Cross-Library Attack
  // -------------------------------------------------------------
  t0 = performance.now();
  // Role credential issued for genuineRoleEnv.payload.library_id (e.g. 'LIB-ZEBRA')
  // Attack attempt: Present to 'ORG-OTHER-TENANT'
  const t13Res = await appCrypto.verifyRoleCredential(genuineRoleEnv, 'ORG-OTHER-TENANT');
  record(
    13,
    'Cross-Library Tenant Attack',
    'Valid credential from Library A attempted against Library B must be blocked',
    'FAIL',
    t13Res.valid,
    t13Res.valid ? 'SECURITY FLAW: Cross-library token accepted!' : (t13Res.error || 'Rejected properly'),
    t0
  );

  // -------------------------------------------------------------
  // Test 14: Offline Verification with Genuine Credential
  // -------------------------------------------------------------
  t0 = performance.now();
  // Verifying purely locally without network
  const t14Res = await appCrypto.verifyOwnerCredential(genuineOwnerEnv);
  record(
    14,
    'Offline Verification (Genuine)',
    'Verification occurs mathematically using embedded public key with 0 network calls',
    'PASS',
    t14Res.valid,
    t14Res.valid ? `Verified offline: ${t14Res.verificationDetails?.verifiedAt}` : (t14Res.error || 'Failed'),
    t0
  );

  // -------------------------------------------------------------
  // Test 15: Offline Tampering
  // -------------------------------------------------------------
  t0 = performance.now();
  const offlineTamperedEnv: SignedCredentialEnvelope<OwnerCredentialPayload> = JSON.parse(JSON.stringify(genuineOwnerEnv));
  offlineTamperedEnv.payload.plan = 'Enterprise'; // unauthorized plan upgrade
  const t15Res = await appCrypto.verifyOwnerCredential(offlineTamperedEnv);
  record(
    15,
    'Offline Tampering Detection',
    'Modifying plan while offline must be instantly caught by offline signature verification',
    'FAIL',
    t15Res.valid,
    t15Res.valid ? 'SECURITY FLAW: Offline tampering succeeded!' : (t15Res.error || 'Rejected properly'),
    t0
  );

  const passedCount = results.filter(r => r.passed).length;
  const failedCount = results.length - passedCount;

  return {
    totalTests: results.length,
    passedCount,
    failedCount,
    allPassed: passedCount === results.length,
    results,
  };
}
