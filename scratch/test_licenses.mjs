const MANAGEMENT_SERVER_URL = 'https://jsvevzzupajrgzxsmmyr.supabase.co';
const MANAGEMENT_SERVER_KEY = 'sb_publishable_xh7iUtUdJYdu4xjzPIVyWg_Wr1_76NR';

async function checkLicenses() {
  const res = await fetch(`${MANAGEMENT_SERVER_URL}/rest/v1/licenses?select=*`, {
    headers: {
      apikey: MANAGEMENT_SERVER_KEY,
      Authorization: `Bearer ${MANAGEMENT_SERVER_KEY}`,
    },
  });
  console.log('Licenses status:', res.status);
  const data = await res.json();
  console.log('Licenses data:', data);
}

checkLicenses();
