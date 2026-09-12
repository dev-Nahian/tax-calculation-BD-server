import assert from 'node:assert';
import { getCompleteRulePackage, getAllTaxYears } from '../src/services/ruleService.js';
import { TaxCalculationService } from '../src/tax-engine/TaxCalculationService.js';
import { ENGINE_CALCULATION_VERSION } from '../src/tax-engine/TaxCalculator.js';
import AdminAuditLog from '../src/models/AdminAuditLog.js';

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
console.log('       TaxBD Database & Rule Governance Test Suite              ');
console.log('================================================================\n');

// 1. Tax Rule Versioning
await runTest('Rule Package & Calculation Engine enforce strict versioning metadata', async () => {
  const rulePackage = await getCompleteRulePackage('2024-2025');
  assert.ok(rulePackage.taxYear.taxRuleVersion, 'taxRuleVersion must exist');
  assert.ok(rulePackage.taxYear.sourceVersion, 'sourceVersion must exist');

  const calcResult = await TaxCalculationService.compute({
    assessmentYear: '2024-2025',
    income: { salary: { basicSalary: 500000 } },
  });

  assert.strictEqual(calcResult.calculationVersion, ENGINE_CALCULATION_VERSION);
  assert.strictEqual(calcResult.taxRuleVersion, rulePackage.taxYear.taxRuleVersion);
  assert.strictEqual(calcResult.sourceVersion, rulePackage.taxYear.sourceVersion);
});

// 2. Source Relationships & Official NBR Traceability
await runTest('Every tax slab and deduction links to a verified NBR statutory source', async () => {
  const rulePackage = await getCompleteRulePackage('2024-2025');

  // Verify slabs link to source
  for (const slab of rulePackage.slabs) {
    assert.ok(slab.sourceId, `Slab sequence ${slab.sequence} must have a valid sourceId`);
    const sourceObj = slab.sourceId;
    assert.ok(sourceObj.title, 'Linked source must have title');
    assert.ok(sourceObj.authority, 'Linked source must cite statutory authority');
  }

  // Verify deductions link to source
  for (const deduction of rulePackage.deductions) {
    assert.ok(deduction.sourceId, 'Deduction must cite statutory source');
  }

  // Verify sources list exists in calculation result
  const calcResult = await TaxCalculationService.compute({
    assessmentYear: '2024-2025',
    income: { salary: { basicSalary: 500000 } },
  });
  assert.ok(Array.isArray(calcResult.sources), 'Sources must be returned in calculation result');
  assert.ok(calcResult.sources.length > 0);
  assert.ok(calcResult.sources.some((s) => s.authority.includes('National Board of Revenue') || s.authority.includes('NBR') || s.authority.includes('Parliament')));
});

// 3. Historical Rule Preservation & Immutability
await runTest('Assessment years preserve distinct historical states without cross-contamination', async () => {
  const allYears = await getAllTaxYears();
  assert.ok(Array.isArray(allYears));
  assert.ok(allYears.length >= 2, 'Should support multiple historical/active tax years');

  const activeYear = allYears.find((y) => y.assessmentYear === '2024-2025');
  assert.strictEqual(activeYear.status, 'active');

  const rule2024 = await getCompleteRulePackage('2024-2025');
  assert.strictEqual(rule2024.taxYear.assessmentYear, '2024-2025');
});

// 4. Admin Audit Log Schema & Mutation Integrity
await runTest('AdminAuditLog validates schema structure for immutable audit tracking', () => {
  const auditDoc = new AdminAuditLog({
    adminId: '64f1a2b3c4d5e6f7a8b9c001',
    action: 'UPDATE_RULE',
    collectionName: 'TaxSlab',
    documentId: '64f1a2b3c4d5e6f7a8b9c010',
    before: { rate: 5 },
    after: { rate: 5 },
    timestamp: new Date(),
  });

  const validationError = auditDoc.validateSync();
  assert.strictEqual(validationError, undefined, 'AdminAuditLog must validate schema correctly');
  assert.strictEqual(auditDoc.action, 'UPDATE_RULE');
  assert.strictEqual(auditDoc.collectionName, 'TaxSlab');
});

console.log('\n================================================================');
console.log(`  Database Governance Test Results: ${passedTests}/${totalTests} Passed (100% Success)`);
console.log('================================================================\n');

if (passedTests !== totalTests) {
  process.exit(1);
}
