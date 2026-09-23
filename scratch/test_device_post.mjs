const MANAGEMENT_SERVER_URL = 'https://jsvevzzupajrgzxsmmyr.supabase.co';
const MANAGEMENT_SERVER_KEY = 'sb_publishable_xh7iUtUdJYdu4xjzPIVyWg_Wr1_76NR';

async function testDevicePost() {
  const devicePayload = {
    device_id: 'DEV-SAN023-DESKTOP',
    organization_id: 'ORG-SAN023',
    org_name: "Sanidhya Shukla's Library",
    license_id: 'LIC-SAN023',
    name: 'Owner Desktop Main Terminal',
    status: 'ONLINE',
    last_seen: new Date().toISOString(),
    activated_at: new Date().toISOString(),
    hardware_fingerprint: 'WIN-CLIENT-EDGE-CHROME-x64',
    app_version: 'v1.0.0-sqlite',
  };

  console.log('Sending POST to devices table on management server...');
  const res = await fetch(`${MANAGEMENT_SERVER_URL}/rest/v1/devices?on_conflict=device_id`, {
    method: 'POST',
    headers: {
      apikey: MANAGEMENT_SERVER_KEY,
      Authorization: `Bearer ${MANAGEMENT_SERVER_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates,return=representation',
    },
    body: JSON.stringify(devicePayload),
  });

  console.log('Response Status:', res.status, res.statusText);
  const text = await res.text();
  console.log('Response Body:', text);
}

testDevicePost();
