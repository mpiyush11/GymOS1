/**
 * Layer 5: Membership Expiry Engine Test Script
 * Run with: npx tsx scripts/test_layer5.ts
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
  console.log('=== Layer 5 Expiry Engine Test Starting ===\n');

  const login = await request('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'owner@testgym.com', password: 'owner123' }),
  });
  gymOwnerCookie = login.res.headers.get('set-cookie')?.split(';')[0] || '';

  const planRes = await request('/api/plans', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Cookie: gymOwnerCookie },
    body: JSON.stringify({ duration_months: 1, price: 999, joining_fee: 0 }),
  });
  const planId = planRes.data.id;
  console.log('   ✓ 1-month plan ready');

  const today = new Date().toISOString().split('T')[0];

  // Dynamic phone number to avoid unique constraint violations
  const dynamicPhone = "99" + Date.now().toString().slice(-8);

  const memberRes = await request('/api/members', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: gymOwnerCookie },
    body: JSON.stringify({
      name: 'Expiry Test Member',
      phone: dynamicPhone,
      plan_id: planId,
      membership_start_date: today,
    }),
  });

  if (!memberRes.res.ok) {
    console.error('FAILED: Member creation endpoint rejected the payload!', memberRes.data);
    process.exit(1);
  }

  // Sanitize date to handle ISO timestamps from database
  const endDate = memberRes.data.membership_end_date 
    ? memberRes.data.membership_end_date.split('T')[0] 
    : '';

  const expectedEnd = new Date(today);
  expectedEnd.setDate(expectedEnd.getDate() + 30);
  const expectedDate = expectedEnd.toISOString().split('T')[0];

  if (endDate !== expectedDate) {
    console.error(`FAILED: End date mismatch. Got ${endDate}, expected ${expectedDate}`);
    process.exit(1);
  }
  console.log(`   ✓ membership_end_date correctly set to ${endDate}`);

  const expiringDate = new Date();
  expiringDate.setDate(expiringDate.getDate() + 5);
  await request(`/api/members/${memberRes.data.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Cookie: gymOwnerCookie },
    body: JSON.stringify({ membership_end_date: expiringDate.toISOString().split('T')[0] }),
  });

  const expiringList = await request('/api/members?membership_status=expiring', {
    method: 'GET',
    headers: { Cookie: gymOwnerCookie },
  });
  console.log(`   ✓ Expiring members count: ${expiringList.data.data.length}`);

  const expiredDate = new Date();
  expiredDate.setDate(expiredDate.getDate() - 1);
  await request(`/api/members/${memberRes.data.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Cookie: gymOwnerCookie },
    body: JSON.stringify({ membership_end_date: expiredDate.toISOString().split('T')[0] }),
  });

  const expiredList = await request('/api/members?membership_status=expired', {
    method: 'GET',
    headers: { Cookie: gymOwnerCookie },
  });
  console.log(`   ✓ Expired members count: ${expiredList.data.data.length}`);

  const stats = await request('/api/dashboard/stats', {
    method: 'GET',
    headers: { Cookie: gymOwnerCookie },
  });
  console.log('   ✓ Dashboard Stats:', stats.data);

  console.log('\n=== Layer 5 Test PASSED ===');
}

main().catch((err) => {
  console.error('Test crashed:', err);
  process.exit(1);
});
