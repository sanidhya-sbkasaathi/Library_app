
async function testFlow() {
  const config = {
    url: 'https://jsvevzzupajrgzxsmmyr.supabase.co',
    anonKey: 'sb_publishable_xh7iUtUdJYdu4xjzPIVyWg_Wr1_76NR',
  };

  console.log('--- TEST 1: Probe Central Management Server (Online) ---');
  const res = await fetch(`${config.url}/rest/v1/licenses?select=organization_id&limit=1`, {
    method: 'GET',
    headers: { apikey: config.anonKey, Authorization: `Bearer ${config.anonKey}` }
  });
  console.log('Online Probe HTTP status:', res.status, res.ok ? '✅ PASSED (200 OK)' : '❌ FAILED');

  console.log('\n--- TEST 2: Query licenses for ORG-SAN002 ---');
  const licRes = await fetch(`${config.url}/rest/v1/licenses?organization_id=eq.ORG-SAN002&select=*`, {
    headers: { apikey: config.anonKey, Authorization: `Bearer ${config.anonKey}`, Accept: 'application/json' }
  });
  const licenses = await licRes.json();
  console.log('Licenses record found:', licenses.length > 0 ? '✅ YES' : '❌ NO');
  if (licenses.length > 0) {
    console.log('Organization:', licenses[0].organization_id);
    console.log('Org Name:', licenses[0].org_name);
    console.log('Current key_hash:', licenses[0].key_hash);
    const hasPbkdf2 = licenses[0].key_hash && licenses[0].key_hash.startsWith('pbkdf2:');
    console.log('Password already registered?:', hasPbkdf2 ? 'YES -> SHOW ASK_PASSWORD' : 'NO -> SHOW CREATE_PASSWORD');
  }

  console.log('\n--- TEST 3: Probe simulated offline (Bad Host) ---');
  try {
    await fetch('http://invalid-offline-host.test', { signal: AbortSignal.timeout(500) });
    console.log('Offline probe result: ❌ FAILED (should have thrown)');
  } catch (e) {
    console.log('Offline probe correctly caught error:', e.message, '✅ PASSED (Gating activates)');
  }
}

testFlow();
