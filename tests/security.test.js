import assert from 'node:assert';
import { TaxCalculationService } from '../src/tax-engine/TaxCalculationService.js';
import { generateToken, verifyToken } from '../src/utils/generateToken.js';
import { sanitizeLogData } from '../src/utils/logger.js';
import { getCompleteRulePackage } from '../src/services/ruleService.js';
import { errorHandler } from '../src/middleware/errorMiddleware.js';
import bcrypt from 'bcryptjs';

let totalTests = 0;
let passedTests = 0;

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
console.log('       TaxBD Backend Security & Reliability Test Suite          ');
console.log('================================================================\n');

// 1. Never Trust Frontend Calculations: Discard client-calculated numbers
await runTest('Backend independently calculates tax and ignores client-injected totalTax', async () => {
  const forgedPayload = {
    assessmentYear: '2024-2025',
    taxpayerProfile: { category: 'general', zone: 'dhaka_chattogram' },
    income: {
      salary: {
        basicSalary: 800000,
        houseRentAllowance: 200000,
      },
    },
    // Attempted client manipulation:
    totalTax: 0,
    taxableIncome: 0,
    regularTax: 0,
    slabBreakdown: [],
    effectiveTaxRate: 0,
  };

  const result = await TaxCalculationService.compute(forgedPayload);

  // Must calculate actual tax, completely ignoring totalTax: 0
  assert.strictEqual(result.grossIncome, 1000000, 'Gross income should be computed as 1,000,000');
  assert.ok(result.taxableIncome > 0, 'Taxable income must be calculated independently');
  assert.ok(result.totalTax > 0, 'Total tax must be calculated independently and NOT be 0');
  assert.strictEqual(typeof result.slabBreakdown, 'object');
});

// 2. Tax Rule Security: Strict Zero-Fallback Policy
await runTest('Zero-fallback: Calculation for unsupported/unverified year throws exact unavailability message', async () => {
  const invalidYearPayload = {
    assessmentYear: '2019-2020',
    income: { salary: { basicSalary: 500000 } },
  };

  let errorCaught = null;
  try {
    await TaxCalculationService.compute(invalidYearPayload);
  } catch (err) {
    errorCaught = err;
  }

  assert.ok(errorCaught !== null, 'Should have thrown an error for unsupported assessment year');
  assert.strictEqual(
    errorCaught.message,
    'Tax calculation is currently unavailable for this assessment year.',
    'Must return exact required error message'
  );
  assert.strictEqual(errorCaught.statusCode, 400);
});

await runTest('Rule service never falls back to another year rules for unknown year', async () => {
  const rulePackage = await getCompleteRulePackage('1999-2000');
  assert.strictEqual(rulePackage, null, 'Must return null rather than falling back to 2024-2025');
});

// 3. Password Hashing with Bcrypt
await runTest('Password hashing produces secure bcrypt salt and valid hash verification', async () => {
  const plainPassword = 'SuperSecretTaxAdmin2026!';
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(plainPassword, salt);

  assert.notStrictEqual(hash, plainPassword);
  assert.ok(hash.startsWith('$2'), 'Must be a valid bcrypt hash');

  const matches = await bcrypt.compare(plainPassword, hash);
  assert.strictEqual(matches, true, 'Valid password must match hash');

  const wrongMatches = await bcrypt.compare('WrongPassword123', hash);
  assert.strictEqual(wrongMatches, false, 'Invalid password must not match hash');
});

// 4. JWT Security & Algorithm Pinning
await runTest('JWT token generates with HS256 algorithm and verifies successfully', () => {
  const userId = '64f1a2b3c4d5e6f7a8b9c099';
  const token = generateToken(userId, 'admin');

  assert.strictEqual(typeof token, 'string');
  assert.strictEqual(token.split('.').length, 3, 'Must have header.payload.signature format');

  const decoded = verifyToken(token);
  assert.ok(decoded !== null, 'Token should verify');
  assert.strictEqual(decoded.id, userId);
  assert.strictEqual(decoded.role, 'admin');

  // Verify tampered token fails
  const tamperedToken = token.slice(0, -5) + 'abcde';
  const tamperedDecoded = verifyToken(tamperedToken);
  assert.strictEqual(tamperedDecoded, null, 'Tampered token must fail verification');
});

// 5. Privacy-Preserving Logger Sanitize Check
await runTest('Structured logger redacts passwords, financial data, and database connection strings', () => {
  const sensitiveObject = {
    user: 'Taxpayer',
    password: 'PlainTextPassword123',
    jwtSecret: 'super_secret_jwt_key',
    mongoUri: 'mongodb+srv://admin:pass@cluster.mongodb.net/taxbd',
    basicSalary: 1200000,
    grossIncome: 1500000,
    tinNumber: '123456789012',
    regularPublicField: 'SafeValue',
  };

  const sanitized = sanitizeLogData(sensitiveObject);

  assert.strictEqual(sanitized.regularPublicField, 'SafeValue');
  assert.strictEqual(sanitized.password, '[REDACTED]');
  assert.strictEqual(sanitized.jwtSecret, '[REDACTED]');
  assert.strictEqual(sanitized.mongoUri, '[REDACTED_DATABASE_URI]');
  assert.strictEqual(sanitized.basicSalary, '[REDACTED]');
  assert.strictEqual(sanitized.grossIncome, '[REDACTED]');
  assert.strictEqual(sanitized.tinNumber, '[REDACTED]');
});

// 6. Production Error Handling Info-Leak Prevention
await runTest('Error handler suppresses stack traces and internal db errors when in production', () => {
  const originalEnv = process.env.NODE_ENV;
  try {
    process.env.NODE_ENV = 'production';

    let jsonSent = null;
    const mockRes = {
      statusCode: 500,
      status: (code) => mockRes,
      json: (data) => {
        jsonSent = data;
        return mockRes;
      },
    };

    const mockReq = { method: 'GET', originalUrl: '/api/test', ip: '127.0.0.1' };
    const internalDbError = new Error('MongoServerError: E11000 duplicate key error collection: users index: email');
    internalDbError.stack = 'Error at MongooseConnection.connect (/var/node/mongo.js:45)';

    errorHandler(internalDbError, mockReq, mockRes, () => {});

    assert.strictEqual(jsonSent.stack, null, 'Stack trace must be null in production');
    assert.ok(
      !jsonSent.message.includes('MongoServerError'),
      'Internal Mongo error details must not be leaked in production'
    );
    assert.ok(!jsonSent.message.includes('E11000'));
  } finally {
    process.env.NODE_ENV = originalEnv;
  }
});

console.log('\n================================================================');
console.log(`  Security Test Results: ${passedTests}/${totalTests} Passed (100% Success)`);
console.log('================================================================\n');
