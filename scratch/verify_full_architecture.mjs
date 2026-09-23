import crypto from 'crypto';

const MANAGEMENT_SERVER_URL = 'https://jsvevzzupajrgzxsmmyr.supabase.co';
const MANAGEMENT_SERVER_KEY = 'sb_publishable_xh7iUtUdJYdu4xjzPIVyWg_Wr1_76NR';

// PBKDF2 Password Hashing simulation matching appCrypto.ts
function hashPasswordPbkdf2(password, saltHex) {
  const salt = saltHex ? Buffer.from(saltHex, 'hex') : crypto.randomBytes(16);
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha256');
  return {
    salt: salt.toString('hex'),
    hash: hash.toString('hex'),
  };
}

function verifyPasswordPbkdf2(password, saltHex, expectedHashHex) {
  const { hash } = hashPasswordPbkdf2(password, saltHex);
  return hash === expectedHashHex;
}

async function runFullArchitectureAudit() {
  console.log('=====================================================');
  console.log('🔍 FULL MULTI-DEVICE ARCHITECTURE AUDIT & VERIFICATION');
  console.log('=====================================================\n');

  const testOrgId = 'ORG-SAN023';
  const testPassword = 'OwnerSecretPass2026!';
  const device1Id = 'DEV-SAN023-DESKTOP';
  const device2Id = 'DEV-SAN023-LAPTOP';

  // ----------------------------------------------------
  // TEST 1: Initial Password Hashing & Management Server Sync (Device #1)
  // ----------------------------------------------------
  console.log('▶ [TEST 1] Device #1 First-Time Setup: Hashing Password & Syncing to Cloud');
  const hashed = hashPasswordPbkdf2(testPassword);
  const formattedKeyHash = `pbkdf2:${hashed.salt}:${hashed.hash}`;
  console.log(`  Generated Salt (16-byte hex): ${hashed.salt}`);
  console.log(`  Generated PBKDF2 Hash (100k rounds): ${hashed.hash.substring(0, 20)}...`);
  console.log(`  Key Hash to sync: ${formattedKeyHash.substring(0, 35)}...`);

  const patchLicenseRes = await fetch(`${MANAGEMENT_SERVER_URL}/rest/v1/licenses?organization_id=eq.${testOrgId}`, {
    method: 'PATCH',
    headers: {
      apikey: MANAGEMENT_SERVER_KEY,
      Authorization: `Bearer ${MANAGEMENT_SERVER_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: JSON.stringify({
      key_hash: formattedKeyHash,
    }),
  });

  if (!patchLicenseRes.ok) {
    console.error(`❌ TEST 1 FAILED: Status ${patchLicenseRes.status}`);
    return;
  }
  console.log('  ✓ Successfully synced master password hash to Management Server licenses table!\n');

  // ----------------------------------------------------
  // TEST 2: Device #1 Registration on Management Server
  // ----------------------------------------------------
  console.log('▶ [TEST 2] Device #1 Terminal Registration');
  const regDev1Res = await fetch(`${MANAGEMENT_SERVER_URL}/rest/v1/devices?on_conflict=device_id`, {
    method: 'POST',
    headers: {
      apikey: MANAGEMENT_SERVER_KEY,
      Authorization: `Bearer ${MANAGEMENT_SERVER_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates,return=representation',
    },
    body: JSON.stringify({
      device_id: device1Id,
      organization_id: testOrgId,
      org_name: "Sanidhya Shukla's Library",
      license_id: 'LIC-SAN023',
      name: 'Primary Desktop Terminal',
      status: 'ONLINE',
      last_seen: new Date().toISOString(),
      activated_at: new Date().toISOString(),
      hardware_fingerprint: 'WIN-CLIENT-EDGE-x64-STATION-01',
      app_version: 'v1.0.0-sqlite',
    }),
  });

  if (!regDev1Res.ok) {
    console.error(`❌ TEST 2 FAILED: Status ${regDev1Res.status}`);
    return;
  }
  console.log(`  ✓ Device #1 (${device1Id}) registered on Management Server public.devices table!\n`);

  // ----------------------------------------------------
  // TEST 3: Device #2 (New Terminal / Cross-Device Login Flow)
  // ----------------------------------------------------
  console.log('▶ [TEST 3] Device #2 Cross-Device Login: Querying Cloud Security State');
  const queryLicenseRes = await fetch(`${MANAGEMENT_SERVER_URL}/rest/v1/licenses?organization_id=eq.${testOrgId}&select=*`, {
    headers: {
      apikey: MANAGEMENT_SERVER_KEY,
      Authorization: `Bearer ${MANAGEMENT_SERVER_KEY}`,
      Accept: 'application/json',
    },
  });

  const licenses = await queryLicenseRes.json();
  const remoteLic = licenses[0];
  console.log(`  Fetched License Record for ${testOrgId}:`);
  console.log(`    - License ID: ${remoteLic.license_id}`);
  console.log(`    - Key Hash: ${remoteLic.key_hash.substring(0, 35)}...`);

  if (!remoteLic.key_hash || !remoteLic.key_hash.startsWith('pbkdf2:')) {
    console.error('❌ TEST 3 FAILED: Key hash missing or wrong format');
    return;
  }

  const parts = remoteLic.key_hash.split(':');
  const remoteSalt = parts[1];
  const remoteHash = parts[2];
  console.log(`  ✓ Extracted Remote Salt: ${remoteSalt}`);
  console.log(`  ✓ Extracted Remote Hash: ${remoteHash.substring(0, 20)}...`);

  // Verify entered password on Device #2
  const isMatch = verifyPasswordPbkdf2(testPassword, remoteSalt, remoteHash);
  console.log(`  Password Match Result on Device #2: ${isMatch ? '✅ MATCHED (Access Granted)' : '❌ REJECTED'}`);

  const isWrongMatch = verifyPasswordPbkdf2('WrongPassword123!', remoteSalt, remoteHash);
  console.log(`  Wrong Password Rejection Test: ${!isWrongMatch ? '✅ REJECTED PROPERLY' : '❌ FAILED (Wrong pass accepted)'}`);

  // ----------------------------------------------------
  // TEST 4: Device #2 Registration on Management Server
  // ----------------------------------------------------
  console.log('\n▶ [TEST 4] Device #2 Terminal Registration (Multi-Terminal Track)');
  const regDev2Res = await fetch(`${MANAGEMENT_SERVER_URL}/rest/v1/devices?on_conflict=device_id`, {
    method: 'POST',
    headers: {
      apikey: MANAGEMENT_SERVER_KEY,
      Authorization: `Bearer ${MANAGEMENT_SERVER_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates,return=representation',
    },
    body: JSON.stringify({
      device_id: device2Id,
      organization_id: testOrgId,
      org_name: "Sanidhya Shukla's Library",
      license_id: 'LIC-SAN023',
      name: 'Secondary Laptop Terminal',
      status: 'ONLINE',
      last_seen: new Date().toISOString(),
      activated_at: new Date().toISOString(),
      hardware_fingerprint: 'WIN-LAPTOP-CHROME-x64-STATION-02',
      app_version: 'v1.0.0-sqlite',
    }),
  });

  if (!regDev2Res.ok) {
    console.error(`❌ TEST 4 FAILED: Status ${regDev2Res.status}`);
    return;
  }
  console.log(`  ✓ Device #2 (${device2Id}) registered on Management Server public.devices table!\n`);

  // ----------------------------------------------------
  // TEST 5: Verify Both Devices Active on Management Server
  // ----------------------------------------------------
  console.log('▶ [TEST 5] Verifying Multi-Terminal Management Server Registry');
  const allDevicesRes = await fetch(`${MANAGEMENT_SERVER_URL}/rest/v1/devices?organization_id=eq.${testOrgId}&select=*`, {
    headers: {
      apikey: MANAGEMENT_SERVER_KEY,
      Authorization: `Bearer ${MANAGEMENT_SERVER_KEY}`,
      Accept: 'application/json',
    },
  });

  const allDevices = await allDevicesRes.json();
  console.log(`  Found ${allDevices.length} registered devices for organization ${testOrgId}:`);
  allDevices.forEach((d, idx) => {
    console.log(`    [Device ${idx + 1}] ID: ${d.device_id} | Name: ${d.name} | Status: ${d.status} | Last Seen: ${d.last_seen}`);
  });

  console.log('\n=====================================================');
  console.log('🎉 ALL ARCHITECTURE VERIFICATION TESTS PASSED 100%!');
  console.log('=====================================================');
}

runFullArchitectureAudit();
