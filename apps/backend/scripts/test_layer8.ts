/**
 * Layer 8: Website Settings Test Script
 * Run with: npx tsx scripts/test_layer8.ts
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
  console.log('=== Layer 8 Website Settings Test Starting ===\n');

  // Login as Gym Owner
  const login = await request('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'owner@testgym.com', password: 'owner123' }),
  });
  gymOwnerCookie = login.res.headers.get('set-cookie')?.split(';')[0] || '';

  // Step 1: Test invalid slug (should return 400)
  console.log('Step 1: Test invalid slug rejection...');
  const invalidSlugRes = await request('/api/website-settings', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Cookie: gymOwnerCookie },
    body: JSON.stringify({
      public_slug: 'My Gym 123',
      phone: '9876543210',
    }),
  });

  if (invalidSlugRes.res.status !== 400) {
    console.error('FAILED: Invalid slug was not rejected with 400', invalidSlugRes.data);
    process.exit(1);
  }
  console.log('   ✓ Invalid slug correctly rejected with 400');

  // Step 2: Test valid slug with data
  console.log('\nStep 2: Save valid website settings...');
  const validPayload = {
    public_slug: 'absolute-kota',
    phone: '9876543210',
    whatsapp: '9876543210',
    email: 'info@absolutekota.com',
    hero_headline: 'Transform Your Fitness',
    social_links: { instagram: 'https://instagram.com/absolute' },
    trainers: [
      { name: 'John Doe', specialty: 'Strength Training' }
    ]
  };

  const saveRes = await request('/api/website-settings', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Cookie: gymOwnerCookie },
    body: JSON.stringify(validPayload),
  });

  if (!saveRes.res.ok) {
    console.error('FAILED: Valid settings save failed', saveRes.data);
    process.exit(1);
  }
  console.log('   ✓ Settings saved successfully');

  // Step 3: Verify GET returns correct data
  console.log('\nStep 3: Verify saved settings via GET...');
  const getRes = await request('/api/website-settings', {
    method: 'GET',
    headers: { Cookie: gymOwnerCookie },
  });

  if (!getRes.res.ok) {
    console.error('FAILED: GET settings failed', getRes.data);
    process.exit(1);
  }

  if (getRes.data.public_slug !== 'absolute-kota' || 
      getRes.data.hero_headline !== 'Transform Your Fitness') {
    console.error('FAILED: Retrieved settings do not match saved data', getRes.data);
    process.exit(1);
  }
  console.log('   ✓ Settings match exactly what was written');

  console.log('\n=== Layer 8 Test PASSED ===');
}

main().catch((err) => {
  console.error('Test crashed:', err);
  process.exit(1);
});
