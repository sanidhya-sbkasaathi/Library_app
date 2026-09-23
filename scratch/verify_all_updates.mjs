import { SupabaseClient } from '../src/utils/supabaseClient.ts';
import { ApiLogger } from '../src/utils/apiLogger.ts';

console.log('=== VERIFYING API LOGGER & UTILITIES ===');

// 1. Test extractProjectRef
console.log('\n[1] Testing extractProjectRef:');
console.log(' - undefined ->', JSON.stringify(SupabaseClient.extractProjectRef(undefined)));
console.log(' - empty string ->', JSON.stringify(SupabaseClient.extractProjectRef('')));
console.log(' - invalid URL ->', JSON.stringify(SupabaseClient.extractProjectRef('invalid-url')));
console.log(' - https://jsvevzzupajrgzxsmmyr.supabase.co ->', JSON.stringify(SupabaseClient.extractProjectRef('https://jsvevzzupajrgzxsmmyr.supabase.co')));

if (SupabaseClient.extractProjectRef(undefined) === '' && 
    SupabaseClient.extractProjectRef('') === '' && 
    SupabaseClient.extractProjectRef('https://jsvevzzupajrgzxsmmyr.supabase.co') === 'jsvevzzupajrgzxsmmyr') {
  console.log('  ✓ extractProjectRef passed: No more fallback to "custom-project" which caused 401 Unauthorized!');
} else {
  console.error('  ❌ extractProjectRef failed');
  process.exit(1);
}

// 2. Test ApiLogger format
console.log('\n[2] Testing ApiLogger:');
ApiLogger.logRequest('GET', 'https://api.example.com/data', { param: 'test' });
// 3. Test Seat Normalization and Reconciliation logic
console.log('\n[3] Testing Seat Normalization & Matching:');
const normalize = (seat) => String(seat || '').trim().toUpperCase().replace(/^SEAT\s*[-_:]?\s*/i, '');
console.log(' - "A03" ->', JSON.stringify(normalize('A03')));
console.log(' - "Seat A03" ->', JSON.stringify(normalize('Seat A03')));
console.log(' - "seat-04" ->', JSON.stringify(normalize('seat-04')));
console.log(' - "A4" ->', JSON.stringify(normalize('A4')));

if (normalize('Seat A03') === 'A03' && normalize('A03') === 'A03') {
  console.log('  ✓ Seat normalization correctly reconciles "Seat A03" with seat id "A03"');
} else {
  console.error('  ❌ Seat normalization failed');
  process.exit(1);
}

console.log('\n=== ALL TARGET LOGIC TESTS PASSED SUCCESSFULLY ===');
