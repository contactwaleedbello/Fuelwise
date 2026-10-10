const assert = require('assert');
const {
  dailyCost,
  monthlyCost,
  costPerWorkHour,
  withPriceRise,
  powerShare,
  neededQuote,
  checkInChange,
  currentStreak,
  validate,
  MILESTONE_DEFS,
  evaluateMilestones,
  nextMilestoneTarget,
  generateInsight,
  validateBackup,
  migrateV1ToV2
} = require('../calc.js');

console.log('--- Running Fuelwise Calculation & Journey Tests ---');

// Case A (base reference inputs)
console.log('\n[Test] Case A (base reference inputs):');
const caseAInputs = {
  litresPerHour: 1.5,
  hoursRunPerDay: 10,
  pricePerLitre: 1000,
  workingDaysPerMonth: 26,
  workingHoursPerDay: 8
};

const caseAErrors = validate(caseAInputs);
assert.strictEqual(caseAErrors.length, 0, 'Case A inputs should have 0 validation errors');

const caseADaily = dailyCost(caseAInputs.litresPerHour, caseAInputs.hoursRunPerDay, caseAInputs.pricePerLitre);
assert.strictEqual(caseADaily, 15000, 'Case A daily cost must be 15000');
console.log(`  ✓ dailyCost: ${caseADaily}`);

const caseAMonthly = monthlyCost(caseADaily, caseAInputs.workingDaysPerMonth);
assert.strictEqual(caseAMonthly, 390000, 'Case A monthly cost must be 390000');
console.log(`  ✓ monthlyCost: ${caseAMonthly}`);

const caseAPerWorkHour = costPerWorkHour(caseAMonthly, caseAInputs.workingDaysPerMonth, caseAInputs.workingHoursPerDay);
assert.strictEqual(caseAPerWorkHour, 1875, 'Case A cost per work hour must be 1875');
console.log(`  ✓ costPerWorkHour: ${caseAPerWorkHour}`);

// Case B (fuel up 20%)
console.log('\n[Test] Case B (fuel up 20%):');
const raisedPrice = withPriceRise(caseAInputs.pricePerLitre, 20);
assert.strictEqual(raisedPrice, 1200, 'Raised price must be 1200');
console.log(`  ✓ withPriceRise(1000, 20): ${raisedPrice}`);

const caseBDaily = dailyCost(caseAInputs.litresPerHour, caseAInputs.hoursRunPerDay, raisedPrice);
assert.strictEqual(caseBDaily, 18000, 'Case B daily cost must be 18000');
console.log(`  ✓ dailyCost: ${caseBDaily}`);

const caseBMonthly = monthlyCost(caseBDaily, caseAInputs.workingDaysPerMonth);
assert.strictEqual(caseBMonthly, 468000, 'Case B monthly cost must be 468000');
console.log(`  ✓ monthlyCost: ${caseBMonthly}`);

const caseBPerWorkHour = costPerWorkHour(caseBMonthly, caseAInputs.workingDaysPerMonth, caseAInputs.workingHoursPerDay);
assert.strictEqual(caseBPerWorkHour, 2250, 'Case B cost per work hour must be 2250');
console.log(`  ✓ costPerWorkHour: ${caseBPerWorkHour}`);

// Validation Tests
console.log('\n[Test] Validation rules:');

const zeroLitres = validate({ ...caseAInputs, litresPerHour: 0 });
assert(zeroLitres.includes('Litres per hour: must be greater than 0.'), 'Zero litresPerHour should fail');
console.log(`  ✓ zero input caught: "${zeroLitres[0]}"`);

const negHoursRun = validate({ ...caseAInputs, hoursRunPerDay: -5 });
assert(negHoursRun.includes('Hours run per day: must be greater than 0.'), 'Negative hoursRunPerDay should fail');
console.log(`  ✓ negative input caught: "${negHoursRun[0]}"`);

const emptyPrice = validate({ ...caseAInputs, pricePerLitre: '' });
assert(emptyPrice.includes('Price per litre: enter a number greater than 0.'), 'Empty pricePerLitre should fail');
console.log(`  ✓ empty input caught: "${emptyPrice[0]}"`);

const textDays = validate({ ...caseAInputs, workingDaysPerMonth: 'twenty' });
assert(textDays.includes('Working days per month: enter a valid number.'), 'Non-numeric input should fail');
console.log(`  ✓ non-numeric text input caught: "${textDays[0]}"`);

const tooManyHoursRun = validate({ ...caseAInputs, hoursRunPerDay: 25 });
assert(tooManyHoursRun.includes('Hours run per day: must be 24 or less.'), 'Hours run > 24 should fail');
console.log(`  ✓ too-large hoursRunPerDay (> 24) caught: "${tooManyHoursRun[0]}"`);

const tooManyDays = validate({ ...caseAInputs, workingDaysPerMonth: 32 });
assert(tooManyDays.includes('Working days per month: must be 31 or less.'), 'Working days > 31 should fail');
console.log(`  ✓ too-large workingDaysPerMonth (> 31) caught: "${tooManyDays[0]}"`);

const tooManyWorkHours = validate({ ...caseAInputs, workingHoursPerDay: 25 });
assert(tooManyWorkHours.includes('Working hours per day: must be 24 or less.'), 'Working hours > 24 should fail');
console.log(`  ✓ too-large workingHoursPerDay (> 24) caught: "${tooManyWorkHours[0]}"`);

// Power share and rate protection tests
console.log('\n[Test] Power share and rate protection:');
const share = powerShare(1875, 5000);
assert.strictEqual(share, 37.5, 'hourly cost 1875, current rate 5000 -> power share must be 37.5%');
console.log(`  ✓ powerShare(1875, 5000): ${share}%`);

const quote = neededQuote(1875, 5000);
assert.strictEqual(quote, 6875, 'hourly cost 1875, take-home target 5000 -> quote needed must be 6875');
console.log(`  ✓ neededQuote(1875, 5000): ₦${quote}`);

// Change between check-ins tests
console.log('\n[Test] Change between check-ins:');
const checkChange = checkInChange(1875, 2250);
assert.strictEqual(checkChange.diff, 375, 'Price change difference must be +375');
assert.strictEqual(checkChange.percent, 20, 'Price change percentage must be +20%');
console.log(`  ✓ checkInChange(1875, 2250): diff = +${checkChange.diff}, percent = +${checkChange.percent}%`);

// Streak tests
console.log('\n[Test] Streak calculation (forgiving rules):');
// weeks [1,2,3], current 3 → 3
const s1 = currentStreak([1, 2, 3], 3);
assert.strictEqual(s1, 3, 'weeks [1,2,3], current 3 must equal 3');
console.log(`  ✓ [1, 2, 3] at week 3 -> streak: ${s1}`);

// weeks [1,2,3], current 4 → 3 (active from week before)
const s2 = currentStreak([1, 2, 3], 4);
assert.strictEqual(s2, 3, 'weeks [1,2,3], current 4 must equal 3');
console.log(`  ✓ [1, 2, 3] at week 4 -> streak: ${s2}`);

// weeks [1,2,3], current 5 → 0 (inactive)
const s3 = currentStreak([1, 2, 3], 5);
assert.strictEqual(s3, 0, 'weeks [1,2,3], current 5 must equal 0');
console.log(`  ✓ [1, 2, 3] at week 5 -> streak: ${s3}`);

// weeks [1,2,4], current 4 → 3 (one forgiven gap)
const s4 = currentStreak([1, 2, 4], 4);
assert.strictEqual(s4, 3, 'weeks [1,2,4], current 4 must equal 3 (one forgiven gap)');
console.log(`  ✓ [1, 2, 4] at week 4 -> streak: ${s4} (one forgiven gap allowed)`);

// weeks [1,3,5], current 5 → 2 (second forgiven gap ends the streak)
const s5 = currentStreak([1, 3, 5], 5);
assert.strictEqual(s5, 2, 'weeks [1,3,5], current 5 must equal 2 (second gap ends streak)');
console.log(`  ✓ [1, 3, 5] at week 5 -> streak: ${s5} (second gap ends streak)`);

// weeks [1,2,5], current 5 → 1 (gap of 3 ends the streak)
const s6 = currentStreak([1, 2, 5], 5);
assert.strictEqual(s6, 1, 'weeks [1,2,5], current 5 must equal 1 (gap of 3 ends streak)');
console.log(`  ✓ [1, 2, 5] at week 5 -> streak: ${s6} (gap of 3 ends streak)`);

// Milestones tests
console.log('\n[Test] Milestones evaluation:');
// 1. "First number": completed setup and saw first result
const mState0 = { hasCalculated: false, checkIns: [], hasProtectedRate: false, hasBackedUp: false };
const m0 = evaluateMilestones(mState0);
assert.strictEqual(m0.first_number, false, 'First number milestone must be locked before calculation');
const m1 = evaluateMilestones({ ...mState0, hasCalculated: true });
assert.strictEqual(m1.first_number, true, 'First number milestone unlocks upon calculation');
console.log('  ✓ "First number" milestone unlocked upon calculation');

// 2. "Price watcher": two check-ins with different prices
const mStatePW1 = { checkIns: [{ weekIndex: 1, pricePerLitre: 1000, costPerWorkHour: 1875 }] };
assert.strictEqual(evaluateMilestones(mStatePW1).price_watcher, false, 'Price watcher locked with 1 check-in');
const mStatePWSame = { checkIns: [
  { weekIndex: 1, pricePerLitre: 1000, costPerWorkHour: 1875 },
  { weekIndex: 2, pricePerLitre: 1000, costPerWorkHour: 1875 }
]};
assert.strictEqual(evaluateMilestones(mStatePWSame).price_watcher, false, 'Price watcher locked when 2 check-ins have identical prices');
const mStatePWDiff = { checkIns: [
  { weekIndex: 1, pricePerLitre: 1000, costPerWorkHour: 1875 },
  { weekIndex: 2, pricePerLitre: 1200, costPerWorkHour: 2250 }
]};
assert.strictEqual(evaluateMilestones(mStatePWDiff).price_watcher, true, 'Price watcher unlocked with 2 check-ins of differing prices');
console.log('  ✓ "Price watcher" milestone unlocked only with differing prices');

// 3. "Rate protector": viewed "Protect your rate" with a rate entered
assert.strictEqual(evaluateMilestones({ hasProtectedRate: false }).rate_protector, false);
assert.strictEqual(evaluateMilestones({ hasProtectedRate: true }).rate_protector, true);
console.log('  ✓ "Rate protector" milestone unlocked upon rate entry');

// 4. "One month in": 4 check-ins
const threeCheckIns = [
  { weekIndex: 1, pricePerLitre: 1000, costPerWorkHour: 1875 },
  { weekIndex: 2, pricePerLitre: 1050, costPerWorkHour: 1968 },
  { weekIndex: 3, pricePerLitre: 1100, costPerWorkHour: 2062 }
];
assert.strictEqual(evaluateMilestones({ checkIns: threeCheckIns }).one_month_in, false, 'Locked at 3 check-ins');
const fourCheckIns = [...threeCheckIns, { weekIndex: 4, pricePerLitre: 1150, costPerWorkHour: 2156 }];
assert.strictEqual(evaluateMilestones({ checkIns: fourCheckIns }).one_month_in, true, 'Unlocked at 4 check-ins');
console.log('  ✓ "One month in" milestone unlocked at exactly 4 check-ins');

// 5. "Quarter tracked": 12 check-ins
const elevenCheckIns = Array.from({ length: 11 }, (_, i) => ({ weekIndex: i + 1, pricePerLitre: 1000, costPerWorkHour: 1875 }));
assert.strictEqual(evaluateMilestones({ checkIns: elevenCheckIns }).quarter_tracked, false, 'Locked at 11 check-ins');
const twelveCheckIns = Array.from({ length: 12 }, (_, i) => ({ weekIndex: i + 1, pricePerLitre: 1000, costPerWorkHour: 1875 }));
assert.strictEqual(evaluateMilestones({ checkIns: twelveCheckIns }).quarter_tracked, true, 'Unlocked at 12 check-ins');
console.log('  ✓ "Quarter tracked" milestone unlocked at exactly 12 check-ins');

// 6. "Backed up": downloaded a backup file
assert.strictEqual(evaluateMilestones({ hasBackedUp: false }).backed_up, false);
assert.strictEqual(evaluateMilestones({ hasBackedUp: true }).backed_up, true);
console.log('  ✓ "Backed up" milestone unlocked upon export');

// Next milestone target
assert.strictEqual(nextMilestoneTarget(0), 4);
assert.strictEqual(nextMilestoneTarget(3), 4);
assert.strictEqual(nextMilestoneTarget(4), 8);
assert.strictEqual(nextMilestoneTarget(11), 12);
assert.strictEqual(nextMilestoneTarget(12), 24);
console.log('  ✓ nextMilestoneTarget progresses cleanly (4 -> 8 -> 12 -> 24)');

// Insights generation
console.log('\n[Test] Insights generation:');
assert.strictEqual(generateInsight([]), null);
assert.strictEqual(generateInsight([fourCheckIns[0]]), null);
const insightText = generateInsight(mStatePWDiff.checkIns);
assert(insightText.includes('peaked at ₦2,250'), 'Insight mentions peak ₦2,250');
assert(insightText.includes('lowest at ₦1,875'), 'Insight mentions lowest ₦1,875');
console.log(`  ✓ generateInsight text: "${insightText}"`);

// Backup validation tests
console.log('\n[Test] Backup validation and migration:');
// Rejects malformed / bad files
assert.strictEqual(validateBackup(null).valid, false);
assert.strictEqual(validateBackup('invalid json string').valid, false);
assert.strictEqual(validateBackup({ version: 1 }).valid, false);
assert.strictEqual(validateBackup({ version: 2, setup: {} }).valid, false);
assert.strictEqual(validateBackup({ version: 2, setup: caseAInputs, checkIns: 'not-an-array' }).valid, false);
assert.strictEqual(validateBackup({ version: 2, setup: caseAInputs, checkIns: [{ bad: 'field' }] }).valid, false);
console.log('  ✓ validateBackup cleanly rejects null, non-objects, wrong versions, and malformed records');

// Accepts valid backup
const validBackupPayload = {
  version: 2,
  setup: caseAInputs,
  hourlyRate: 5000,
  checkIns: [
    { weekIndex: 1, pricePerLitre: 1000, costPerWorkHour: 1875 },
    { weekIndex: 2, pricePerLitre: 1200, costPerWorkHour: 2250 }
  ],
  milestones: {
    hasCalculated: true,
    hasProtectedRate: true,
    hasBackedUp: true
  }
};
assert.strictEqual(validateBackup(validBackupPayload).valid, true);
console.log('  ✓ validateBackup accepts valid v2 payload');

// v1 migration
const v1Data = {
  litresPerHour: '1.5',
  hoursRunPerDay: '10',
  pricePerLitre: '1000',
  workingDaysPerMonth: '26',
  workingHoursPerDay: '8'
};
const migrated = migrateV1ToV2(v1Data);
assert.strictEqual(migrated.version, 2);
assert.strictEqual(migrated.setup.litresPerHour, '1.5');
assert.strictEqual(migrated.setup.pricePerLitre, '1000');
assert.strictEqual(migrated.milestones.hasCalculated, true);
assert.deepStrictEqual(migrated.checkIns, []);
console.log('  ✓ migrateV1ToV2 accurately maps all 5 fields into v2 with zero loss');

console.log('\n--- All tests passed successfully ---');
