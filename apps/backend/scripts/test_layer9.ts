/**
 * Layer 9: Public API Engine Test Script
 * Run with: npx tsx scripts/test_layer9.ts
 */

const BASE_URL = 'http://localhost:4000';

async function request(path: string, options: any = {}) {
  const headers = { ...options.headers };
  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  return { res, data };
}

async function main() {
  console.log('=== Layer 9 Public API Test Starting ===\n');

  // Step 1: Fetch valid public site data
  console.log('Step 1: Fetch public site data for absolute-kota...');
  const validRes = await request('/api/public/site/absolute-kota');

  if (!validRes.res.ok) {
    console.error('FAILED: Valid slug request failed', validRes.data);
    process.exit(1);
  }

  if (!validRes.data.gym_name || !validRes.data.settings || !validRes.data.plans) {
    console.error('FAILED: Response structure is incomplete', validRes.data);
    process.exit(1);
  }

  console.log(`   ✓ Successfully fetched data for gym: ${validRes.data.gym_name}`);
  console.log(`   ✓ Plans count: ${validRes.data.plans.length}`);

  // Step 2: Test non-existent slug (should return 404)
  console.log('\nStep 2: Test non-existent slug...');
  const invalidRes = await request('/api/public/site/this-slug-does-not-exist-xyz');

  if (invalidRes.res.status !== 404) {
    console.error(`FAILED: Expected 404, got ${invalidRes.res.status}`, invalidRes.data);
    process.exit(1);
  }

  console.log('   ✓ Non-existent slug correctly returned 404');

  console.log('\n=== Layer 9 Test PASSED ===');
}

main().catch((err) => {
  console.error('Test crashed:', err);
  process.exit(1);
});
