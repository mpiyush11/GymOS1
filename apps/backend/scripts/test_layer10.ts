/**
 * Layer 10: Public Lead Capture Test Script
 * Run with: npx tsx scripts/test_layer10.ts
 */

const BASE_URL = 'http://localhost:4000';

let gymOwnerCookie = '';

async function request(path: string, options: any = {}) {
  const headers = { ...options.headers };
  if (options.cookie) headers['Cookie'] = options.cookie;

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  return { res, data };
}

async function main() {
  console.log('=== Layer 10 Public Lead Capture Test Starting ===\n');

  // Phase 1: Submit public lead with valid slug
  console.log('Phase 1: Submit public lead via POST /api/public/leads...');
  const dynamicPhone = "77" + Date.now().toString().slice(-8);
  const leadRes = await request('/api/public/leads', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      public_slug: 'absolute-kota',
      name: 'Public Lead Test',
      phone: dynamicPhone,
      email: 'publiclead@test.com',
    }),
  });

  if (!leadRes.res.ok) {
    console.error('FAILED: Public lead submission failed', leadRes.data);
    process.exit(1);
  }

  if (leadRes.res.status !== 201) {
    console.error(`FAILED: Expected 201, got ${leadRes.res.status}`);
    process.exit(1);
  }

  const leadId = leadRes.data.id;
  console.log(`   ✓ Lead created successfully with ID: ${leadId}`);

  // Phase 2: Login as Gym Owner
  console.log('\nPhase 2: Login as Gym Owner...');
  const login = await request('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'owner@testgym.com', password: 'owner123' }),
  });
  gymOwnerCookie = login.res.headers.get('set-cookie')?.split(';')[0] || '';

  // Phase 3: Verify lead appears in internal CRM
  console.log('\nPhase 3: Verify lead in internal CRM (GET /api/leads)...');
  const leadsList = await request('/api/leads', {
    method: 'GET',
    headers: { Cookie: gymOwnerCookie },
  });

  if (!leadsList.res.ok) {
    console.error('FAILED: Fetching leads failed', leadsList.data);
    process.exit(1);
  }

  const leadFound = leadsList.data.data.some((lead: any) => lead.id === leadId);
  if (!leadFound) {
    console.error('FAILED: Public lead not found in Gym Owner CRM');
    process.exit(1);
  }
  console.log('   ✓ Public lead successfully appears in internal leads list');

  // Phase 4: Test invalid slug (should return 404)
  console.log('\nPhase 4: Test submission with fake slug...');
  const fakeSlugRes = await request('/api/public/leads', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      public_slug: 'this-slug-does-not-exist-xyz',
      name: 'Fake Lead',
      phone: '9999999999',
    }),
  });

  if (fakeSlugRes.res.status !== 404) {
    console.error(`FAILED: Expected 404 for fake slug, got ${fakeSlugRes.res.status}`);
    process.exit(1);
  }
  console.log('   ✓ Fake slug correctly rejected with 404');

  console.log('\n=== Layer 10 Test PASSED ===');
}

main().catch((err) => {
  console.error('Test crashed:', err);
  process.exit(1);
});
