const assert = require('assert');
const {
  dailyCost,
  monthlyCost,
  costPerWorkHour,
  withPriceRise,
  validate
} = require('../calc.js');

console.log('--- Running Fuelwise Calculation Tests ---');

// Case A (base)
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

// Zero values
const zeroLitres = validate({ ...caseAInputs, litresPerHour: 0 });
assert(zeroLitres.includes('Litres per hour: must be greater than 0.'), 'Zero litresPerHour should fail');
console.log(`  ✓ zero input caught: "${zeroLitres[0]}"`);

// Negative values
const negHoursRun = validate({ ...caseAInputs, hoursRunPerDay: -5 });
assert(negHoursRun.includes('Hours run per day: must be greater than 0.'), 'Negative hoursRunPerDay should fail');
console.log(`  ✓ negative input caught: "${negHoursRun[0]}"`);

// Empty values
const emptyPrice = validate({ ...caseAInputs, pricePerLitre: '' });
assert(emptyPrice.includes('Price per litre: enter a number greater than 0.'), 'Empty pricePerLitre should fail');
console.log(`  ✓ empty input caught: "${emptyPrice[0]}"`);

// Text / non-numeric values
const textDays = validate({ ...caseAInputs, workingDaysPerMonth: 'twenty' });
assert(textDays.includes('Working days per month: enter a valid number.'), 'Non-numeric input should fail');
console.log(`  ✓ non-numeric text input caught: "${textDays[0]}"`);

// Too large values
const tooManyHoursRun = validate({ ...caseAInputs, hoursRunPerDay: 25 });
assert(tooManyHoursRun.includes('Hours run per day: must be 24 or less.'), 'Hours run > 24 should fail');
console.log(`  ✓ too-large hoursRunPerDay (> 24) caught: "${tooManyHoursRun[0]}"`);

const tooManyDays = validate({ ...caseAInputs, workingDaysPerMonth: 32 });
assert(tooManyDays.includes('Working days per month: must be 31 or less.'), 'Working days > 31 should fail');
console.log(`  ✓ too-large workingDaysPerMonth (> 31) caught: "${tooManyDays[0]}"`);

const tooManyWorkHours = validate({ ...caseAInputs, workingHoursPerDay: 25 });
assert(tooManyWorkHours.includes('Working hours per day: must be 24 or less.'), 'Working hours > 24 should fail');
console.log(`  ✓ too-large workingHoursPerDay (> 24) caught: "${tooManyWorkHours[0]}"`);

console.log('\n--- All 12 test assertions passed successfully ---');
