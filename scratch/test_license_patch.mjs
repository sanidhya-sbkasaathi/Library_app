const MANAGEMENT_SERVER_URL = 'https://jsvevzzupajrgzxsmmyr.supabase.co';
const MANAGEMENT_SERVER_KEY = 'sb_publishable_xh7iUtUdJYdu4xjzPIVyWg_Wr1_76NR';

async function testUpdateLicense() {
  const orgId = 'ORG-SAN023';
  const testHash = 'pbkdf2:a1b2c3d4e5f6:f9e8d7c6b5a43210';
  
  console.log('Patching license key_hash on management server...');
  const res = await fetch(`${MANAGEMENT_SERVER_URL}/rest/v1/licenses?organization_id=eq.${orgId}`, {
    method: 'PATCH',
    headers: {
      apikey: MANAGEMENT_SERVER_KEY,
      Authorization: `Bearer ${MANAGEMENT_SERVER_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: JSON.stringify({
      key_hash: testHash,
    }),
  });

  console.log('Status:', res.status);
  const data = await res.json();
  console.log('Result:', data);
}

testUpdateLicense();
