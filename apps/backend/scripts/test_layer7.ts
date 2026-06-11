/**
 * Layer 7: Leads Engine Test Script
 * Run with: npx tsx scripts/test_layer7.ts
 */

const BASE_URL = 'http://localhost:4000';

let gymOwnerCookie = '';
let superAdminCookie = '';

async function request(path: string, options: any = {}) {
  const headers = { ...options.headers };
  if (options.cookie) headers['Cookie'] = options.cookie;

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  return { res, data };
}

async function main() {
  console.log('=== Layer 7 Leads Test Starting ===\n');

  const loginA = await request('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'owner@testgym.com', password: 'owner123' }),
  });
  gymOwnerCookie = loginA.res.headers.get('set-cookie')?.split(';')[0] || '';

  const loginSuper = await request('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@gymos.dev', password: 'password' }),
  });
  superAdminCookie = loginSuper.res.headers.get('set-cookie')?.split(';')[0] || '';

  // Step 1: Create lead
  console.log('Step 1: Create lead...');
  const dynamicPhone = "88" + Date.now().toString().slice(-8);
  const createRes = await request('/api/leads', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: gymOwnerCookie },
    body: JSON.stringify({
      name: 'Test Lead',
      phone: dynamicPhone,
      email: 'lead@test.com',
    }),
  });

  if (!createRes.res.ok) {
    console.error('FAILED: Lead creation failed', createRes.data);
    process.exit(1);
  }
  const leadId = createRes.data.id;
  console.log('   ✓ Lead created');

  // Step 2: Update status
  console.log('\nStep 2: Update status to contacted...');
  const updateRes = await request(`/api/leads/${leadId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Cookie: gymOwnerCookie },
    body: JSON.stringify({ status: 'contacted' }),
  });

  if (!updateRes.res.ok) {
    console.error('FAILED: Lead update failed', updateRes.data);
    process.exit(1);
  }
  console.log('   ✓ Status updated to contacted');

  // Step 3: Filter leads by status=contacted (dynamic verification)
  console.log('\nStep 3: Filter leads by status=contacted...');
  const filterRes = await request('/api/leads?status=contacted', {
    method: 'GET',
    headers: { Cookie: gymOwnerCookie },
  });

  if (!filterRes.res.ok) {
    console.error('FAILED: Filtered leads fetch failed', filterRes.data);
    process.exit(1);
  }

  const foundLead = filterRes.data.data.some((lead: any) => lead.id === leadId);
  if (!foundLead) {
    console.error('FAILED: Lead not found in contacted filter');
    process.exit(1);
  }
  console.log('   ✓ Lead found in contacted filter');

  // Step 4: Real Tenant Isolation Test (GET /:id)
  console.log('\nStep 4: Real Tenant Isolation Test (GET /:id)...');
  const isolationRes = await request(`/api/leads/${leadId}`, {
    method: 'GET',
    headers: { Cookie: superAdminCookie },
  });

  if (isolationRes.res.ok) {
    console.error('FAILED: Cross-tenant GET was NOT blocked!');
    process.exit(1);
  }

  if (isolationRes.res.status !== 404 && isolationRes.res.status !== 403) {
    console.error(`FAILED: Expected 404 or 403, got ${isolationRes.res.status}`);
    process.exit(1);
  }

  console.log('   ✓ Tenant isolation correctly enforced via GET /:id');

  console.log('\n=== Layer 7 Test PASSED ===');
}

main().catch((err) => {
  console.error('Test crashed:', err);
  process.exit(1);
});
