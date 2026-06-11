/**
 * Layer 6: Payments Ledger Test Script
 * Run with: npx tsx scripts/test_layer6.ts
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
  console.log('=== Layer 6 Payments Test Starting ===\n');

  // Login
  const login = await request('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'owner@testgym.com', password: 'owner123' }),
  });
  gymOwnerCookie = login.res.headers.get('set-cookie')?.split(';')[0] || '';

  // Create a 1-month plan
  const planRes = await request('/api/plans', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Cookie: gymOwnerCookie },
    body: JSON.stringify({ duration_months: 1, price: 999, joining_fee: 0 }),
  });
  const planId = planRes.data.id;

  // Create a member
  const dynamicPhone = "99" + Date.now().toString().slice(-8);
  const memberRes = await request('/api/members', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: gymOwnerCookie },
    body: JSON.stringify({
      name: 'Payment Test Member',
      phone: dynamicPhone,
    }),
  });
  const memberId = memberRes.data.id;
  console.log('   ✓ Member created');

  // Step 1: First payment
  console.log('\nStep 1: First payment (new membership)...');
  const payment1 = await request('/api/payments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: gymOwnerCookie },
    body: JSON.stringify({
      member_id: memberId,
      plan_id: planId,
      payment_method: 'cash',
    }),
  });

  if (!payment1.res.ok) {
    console.error('FAILED: First payment failed', payment1.data);
    process.exit(1);
  }
  console.log(`   ✓ First payment successful. New end date: ${payment1.data.new_end_date}`);

  // Step 2: Second payment (renewal while active)
  console.log('\nStep 2: Renewal payment (extension from existing end date)...');
  const payment2 = await request('/api/payments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: gymOwnerCookie },
    body: JSON.stringify({
      member_id: memberId,
      plan_id: planId,
      payment_method: 'upi',
    }),
  });

  if (!payment2.res.ok) {
    console.error('FAILED: Renewal payment failed', payment2.data);
    process.exit(1);
  }
  console.log(`   ✓ Renewal successful. New end date: ${payment2.data.new_end_date}`);

  // Step 3: Dashboard revenue
  console.log('\nStep 3: Dashboard revenue checks...');
  const statsAll = await request('/api/dashboard/stats', {
    method: 'GET',
    headers: { Cookie: gymOwnerCookie },
  });
  console.log(`   ✓ Total Revenue (all time): ${statsAll.data.totalRevenue}`);

  const statsFiltered = await request('/api/dashboard/stats?startDate=2025-01-01', {
    method: 'GET',
    headers: { Cookie: gymOwnerCookie },
  });
  console.log(`   ✓ Total Revenue (filtered): ${statsFiltered.data.totalRevenue}`);

  console.log('\n=== Layer 6 Test PASSED ===');
}

main().catch((err) => {
  console.error('Test crashed:', err);
  process.exit(1);
});
