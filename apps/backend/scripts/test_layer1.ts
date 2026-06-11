/**
 * Layer 1 + Layer 3 Integration Test Script
 * Run with: npx tsx scripts/test_layer1.ts
 */

const BASE_URL = 'http://localhost:4000';

let superAdminCookie = '';
let gymOwnerCookie = '';

async function request(path: string, options: any = {}) {
  const headers = { ...options.headers };
  
  if (options.cookie) {
    headers['Cookie'] = options.cookie;
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  });

  const setCookie = res.headers.get('set-cookie');
  let cookie = '';
  if (setCookie) {
    cookie = setCookie.split(';')[0];
  }

  const data = await res.json().catch(() => ({}));
  return { res, data, cookie };
}

async function main() {
  console.log('=== Layer 1 + Layer 3 Test Starting ===\n');

  const uniqueEmail = `owner_${Date.now()}@testgym.com`;

  // 1. Super Admin Login
  console.log('1. Super Admin Login...');
  const loginRes = await request('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'admin@gymos.dev',
      password: 'password',
    }),
  });

  if (!loginRes.res.ok) {
    console.error('FAILED: Super Admin login failed', loginRes.data);
    process.exit(1);
  }
  superAdminCookie = loginRes.cookie;
  console.log('   ✓ Super Admin logged in. Cookie set:', !!superAdminCookie);

  // 2. Create Gym
  console.log('\n2. Create Gym...');
  const gymRes = await request('/api/gyms', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: superAdminCookie,
    },
    body: JSON.stringify({ name: 'Test Gym Layer1' }),
  });

  if (!gymRes.res.ok) {
    console.error('FAILED: Create gym failed', gymRes.data);
    process.exit(1);
  }
  const gymId = gymRes.data.id;
  console.log('   ✓ Gym created. ID:', gymId);

  // 3. Create Gym Owner
  console.log('\n3. Create Gym Owner...');
  const ownerRes = await request('/api/users', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: superAdminCookie,
    },
    body: JSON.stringify({
      email: uniqueEmail,
      password: 'owner123',
      gym_id: gymId,
    }),
  });

  if (!ownerRes.res.ok) {
    console.error('FAILED: Create gym owner failed', ownerRes.data);
    process.exit(1);
  }
  console.log('   ✓ Gym Owner created. Email:', uniqueEmail);

  // 4. Gym Owner Login
  console.log('\n4. Gym Owner Login...');
  const ownerLoginRes = await request('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: uniqueEmail,
      password: 'owner123',
    }),
  });

  if (!ownerLoginRes.res.ok) {
    console.error('FAILED: Gym Owner login failed', ownerLoginRes.data);
    process.exit(1);
  }
  gymOwnerCookie = ownerLoginRes.cookie;
  console.log('   ✓ Gym Owner logged in. New cookie set:', !!gymOwnerCookie);

  // 5. Tenant Isolation Check
  console.log('\n5. Tenant Isolation Check (/api/gyms/me)...');
  const meRes = await request('/api/gyms/me', {
    method: 'GET',
    headers: { Cookie: gymOwnerCookie },
  });

  if (!meRes.res.ok) {
    console.error('FAILED: /api/gyms/me failed', meRes.data);
    process.exit(1);
  }

  if (meRes.data.id !== gymId) {
    console.error('FAILED: Tenant isolation broken. Got wrong gym:', meRes.data);
    process.exit(1);
  }

  console.log('   ✓ Tenant isolation verified. Gym Owner sees only their gym.');

  // 6. Gym Setup Update (Layer 2)
  console.log('\n6. Gym Setup Update (/api/gyms/my-setup)...');
  const setupRes = await request('/api/gyms/my-setup', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Cookie: gymOwnerCookie,
    },
    body: JSON.stringify({
      phone: '9876543210',
      whatsapp: '9876543210',
      email: 'contact@testgym.com',
      address: '123 Main Street, Mumbai',
      theme_id: 'theme_2',
    }),
  });

  if (!setupRes.res.ok) {
    console.error('FAILED: Gym setup update failed', setupRes.data);
    process.exit(1);
  }

  const verifyRes = await request('/api/gyms/me', {
    method: 'GET',
    headers: { Cookie: gymOwnerCookie },
  });

  if (verifyRes.data.phone !== '9876543210' || verifyRes.data.theme_id !== 'theme_2') {
    console.error('FAILED: Setup update verification failed', verifyRes.data);
    process.exit(1);
  }

  console.log('   ✓ Gym setup updated and verified via /api/gyms/me.');

  // 7. Create/Update Membership Plan (Layer 3)
  console.log('\n7. Create 3-Month Membership Plan (/api/plans)...');
  const planRes = await request('/api/plans', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Cookie: gymOwnerCookie,
    },
    body: JSON.stringify({
      duration_months: 3,
      price: 2999,
      joining_fee: 500,
    }),
  });

  if (!planRes.res.ok) {
    console.error('FAILED: Create plan failed', planRes.data);
    process.exit(1);
  }
  console.log('   ✓ 3-month plan created/updated.');

  // 8. Verify Plans Retrieval (Layer 3)
  console.log('\n8. Fetch All Plans (/api/plans)...');
  const plansRes = await request('/api/plans', {
    method: 'GET',
    headers: { Cookie: gymOwnerCookie },
  });

  if (!plansRes.res.ok) {
    console.error('FAILED: Fetch plans failed', plansRes.data);
    process.exit(1);
  }

  const threeMonthPlan = plansRes.data.find((p: any) => p.duration_months === 3);
  if (!threeMonthPlan || threeMonthPlan.price !== 2999) {
    console.error('FAILED: Plans verification failed', plansRes.data);
    process.exit(1);
  }

  console.log('   ✓ Plans retrieved and validated successfully.');

  console.log('\n=== Layer 1 + Layer 3 Test PASSED ===');
}

main().catch((err) => {
  console.error('Test crashed:', err);
  process.exit(1);
});
