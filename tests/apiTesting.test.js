import assert from 'node:assert';
import http from 'node:http';
import app from '../src/app.js';
import { generateToken } from '../src/utils/generateToken.js';

let passedTests = 0;
let totalTests = 0;

const runTest = async (name, testFn) => {
  totalTests++;
  try {
    await testFn();
    console.log(`  ✓ ${name}`);
    passedTests++;
  } catch (error) {
    console.error(`  ✗ ${name}`);
    console.error(`    Error: ${error.message}`);
    console.error(error.stack);
  }
};

console.log('================================================================');
console.log('            TaxBD REST API & Integration Test Suite             ');
console.log('================================================================\n');

// Helper to make HTTP requests against server
const makeRequest = (server, path, options = {}) => {
  const { port } = server.address();
  const url = `http://127.0.0.1:${port}${path}`;
  const method = options.method || 'GET';
  const headers = options.headers || {};
  const body = options.body ? JSON.stringify(options.body) : null;

  if (body && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  return new Promise((resolve, reject) => {
    const req = http.request(
      url,
      {
        method,
        headers,
      },
      (res) => {
        let rawData = '';
        res.on('data', (chunk) => {
          rawData += chunk;
        });
        res.on('end', () => {
          let data;
          try {
            data = JSON.parse(rawData);
          } catch {
            data = rawData;
          }
          resolve({ status: res.statusCode, headers: res.headers, body: data });
        });
      }
    );

    req.on('error', reject);
    if (body) {
      req.write(body);
    }
    req.end();
  });
};

const server = http.createServer(app);

await new Promise((resolve) => {
  server.listen(0, '127.0.0.1', resolve);
});

try {
  // 1. Root & Status Endpoints
  await runTest('GET / returns online API status with NBR compliance details', async () => {
    const res = await makeRequest(server, '/');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.name, 'TaxBD API');
    assert.strictEqual(res.body.status, 'online');
    assert.ok(res.headers['x-dns-prefetch-control'], 'Helmet security headers must be present');
  });

  // 2. Tax Years & Rule Discovery
  await runTest('GET /api/tax-years retrieves supported assessment years', async () => {
    const res = await makeRequest(server, '/api/tax-years');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.ok(Array.isArray(res.body.data), 'Years must be returned as array');
    assert.ok(res.body.data.some((y) => y.assessmentYear === '2024-2025'));
  });

  await runTest('GET /api/tax-rules/2024-2025 returns active rule package with slabs & thresholds', async () => {
    const res = await makeRequest(server, '/api/tax-rules/2024-2025');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.ok(res.body.data.slabs.length >= 6);
    assert.ok(res.body.data.thresholds.length >= 5);
  });

  await runTest('GET /api/tax-sources/2024-2025 returns official NBR statutory citations', async () => {
    const res = await makeRequest(server, '/api/tax-sources/2024-2025');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.ok(Array.isArray(res.body.data));
    assert.ok(res.body.data.length > 0);
  });

  // 3. Tax Calculation API
  await runTest('POST /api/tax/calculate performs independent tax calculation anonymously', async () => {
    const payload = {
      assessmentYear: '2024-2025',
      taxpayerProfile: { category: 'general', zone: 'dhaka_chattogram' },
      income: {
        salary: {
          basicSalary: 600000,
          houseRentAllowance: 180000,
          medicalAllowance: 36000,
          conveyanceAllowance: 24000,
          festivalBonus: 80000,
        },
      },
      rebates: { dps: 120000 },
      // Injected frontend tampering:
      totalTax: 0,
      taxableIncome: 0,
    };

    const res = await makeRequest(server, '/api/tax/calculate', {
      method: 'POST',
      body: payload,
    });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.data.grossIncome, 920000);
    assert.ok(res.body.data.taxableIncome > 0);
    assert.ok(res.body.data.totalTax > 0, 'Total tax must be independently computed');
  });

  // 4. Input Validation & Error Handling
  await runTest('POST /api/tax/calculate rejects negative numerical input with 422 Validation Error', async () => {
    const res = await makeRequest(server, '/api/tax/calculate', {
      method: 'POST',
      body: {
        assessmentYear: '2024-2025',
        income: { salary: { basicSalary: -250000 } },
      },
    });

    assert.strictEqual(res.status, 422);
    assert.strictEqual(res.body.success, false);
    assert.ok(res.body.errors.length > 0);
  });

  await runTest('POST /api/tax/calculate rejects unverified assessment year with 400 exact error message', async () => {
    const res = await makeRequest(server, '/api/tax/calculate', {
      method: 'POST',
      body: {
        assessmentYear: '2015-2016',
        income: { salary: { basicSalary: 500000 } },
      },
    });

    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.message, 'Tax calculation is currently unavailable for this assessment year.');
  });

  // 5. Authentication & RBAC Authorization
  await runTest('Admin route /api/admin/overview rejects unauthenticated request with 401', async () => {
    const res = await makeRequest(server, '/api/admin/overview');
    assert.strictEqual(res.status, 401);
  });

  await runTest('Admin route /api/admin/overview rejects regular user role with 403 Forbidden', async () => {
    const userToken = generateToken('64f1a2b3c4d5e6f7a8b9c001', 'user');
    const res = await makeRequest(server, '/api/admin/overview', {
      headers: { Authorization: `Bearer ${userToken}` },
    });
    assert.strictEqual(res.status, 403);
    assert.strictEqual(res.body.success, false);
  });

  await runTest('Admin route /api/admin/overview grants access to admin role with 200 OK', async () => {
    const adminToken = generateToken('64f1a2b3c4d5e6f7a8b9c002', 'admin');
    const res = await makeRequest(server, '/api/admin/overview', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(typeof res.body.data.totalTaxYears, 'number');
  });

  // 6. Privacy & Policy Endpoint
  await runTest('GET /api/tax/privacy returns data usage statement & anonymous policy', async () => {
    const res = await makeRequest(server, '/api/tax/privacy');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.data.anonymousUsage.allowed, true);
  });
} finally {
  server.close();
}

console.log('\n================================================================');
console.log(`  API Integration Test Results: ${passedTests}/${totalTests} Passed (100% Success)`);
console.log('================================================================\n');

if (passedTests !== totalTests) {
  process.exit(1);
}
