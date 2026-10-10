/**
 * Pure calculation functions for Fuelwise.
 * No DOM code, no side-effects.
 */

function dailyCost(litresPerHour, hoursRunPerDay, pricePerLitre) {
  return litresPerHour * hoursRunPerDay * pricePerLitre;
}

function monthlyCost(daily, workingDaysPerMonth) {
  return daily * workingDaysPerMonth;
}

function costPerWorkHour(monthly, workingDaysPerMonth, workingHoursPerDay) {
  const totalWorkHours = workingDaysPerMonth * workingHoursPerDay;
  if (totalWorkHours === 0) return 0;
  return monthly / totalWorkHours;
}

function withPriceRise(pricePerLitre, risePercent) {
  return pricePerLitre * (1 + risePercent / 100);
}

function powerShare(costPerWorkHour, hourlyRate) {
  if (!hourlyRate || hourlyRate <= 0) return 0;
  return (costPerWorkHour / hourlyRate) * 100;
}

function neededQuote(costPerWorkHour, targetTakeHome) {
  if (!targetTakeHome || targetTakeHome <= 0) return costPerWorkHour;
  return Number(targetTakeHome) + Number(costPerWorkHour);
}

function checkInChange(previousCostPerHour, currentCostPerHour) {
  const diff = currentCostPerHour - previousCostPerHour;
  const percent = previousCostPerHour > 0 ? (diff / previousCostPerHour) * 100 : 0;
  return { diff, percent };
}

function currentStreak(weekIndexes, currentWeekIndex) {
  if (!Array.isArray(weekIndexes) || weekIndexes.length === 0) return 0;

  const uniqueWeeks = Array.from(new Set(weekIndexes.map(Number)))
    .filter(n => !Number.isNaN(n))
    .sort((a, b) => a - b);

  if (uniqueWeeks.length === 0) return 0;

  const latestWeek = uniqueWeeks[uniqueWeeks.length - 1];

  if (latestWeek !== currentWeekIndex && latestWeek !== currentWeekIndex - 1) {
    return 0;
  }

  let count = 1;
  let hasForgivenGap = false;

  for (let i = uniqueWeeks.length - 1; i > 0; i--) {
    const diff = uniqueWeeks[i] - uniqueWeeks[i - 1];
    if (diff === 1) {
      count++;
    } else if (diff === 2 && !hasForgivenGap) {
      hasForgivenGap = true;
      count++;
    } else {
      break;
    }
  }

  return count;
}

function validate(inputs) {
  const errors = [];
  const fields = [
    { key: 'litresPerHour', label: 'Litres per hour', max: null },
    { key: 'hoursRunPerDay', label: 'Hours run per day', max: 24 },
    { key: 'pricePerLitre', label: 'Price per litre', max: null },
    { key: 'workingDaysPerMonth', label: 'Working days per month', max: 31 },
    { key: 'workingHoursPerDay', label: 'Working hours per day', max: 24 }
  ];

  for (const field of fields) {
    const rawVal = inputs ? inputs[field.key] : undefined;

    if (rawVal === undefined || rawVal === null || (typeof rawVal === 'string' && rawVal.trim() === '')) {
      errors.push(`${field.label}: enter a number greater than 0.`);
      continue;
    }

    const val = Number(rawVal);

    if (Number.isNaN(val)) {
      errors.push(`${field.label}: enter a valid number.`);
      continue;
    }

    if (val <= 0) {
      errors.push(`${field.label}: must be greater than 0.`);
      continue;
    }

    if (field.max !== null && val > field.max) {
      errors.push(`${field.label}: must be ${field.max} or less.`);
      continue;
    }
  }

  return errors;
}

const MILESTONE_DEFS = [
  { id: 'first_number', title: 'First number', desc: 'Completed setup and saw your first hourly fuel cost.' },
  { id: 'price_watcher', title: 'Price watcher', desc: 'Tracked two check-ins with different fuel prices.' },
  { id: 'rate_protector', title: 'Rate protector', desc: 'Protected your freelance rate against fuel costs.' },
  { id: 'one_month_in', title: 'One month in', desc: 'Tracked 4 weeks of fuel prices.' },
  { id: 'quarter_tracked', title: 'Quarter tracked', desc: 'Tracked 12 weeks of fuel prices.' },
  { id: 'backed_up', title: 'Backed up', desc: 'Safely downloaded a backup of your data.' }
];

function evaluateMilestones(state) {
  const s = state || {};
  const checkIns = Array.isArray(s.checkIns) ? s.checkIns : [];
  const prices = checkIns.map(c => Number(c.pricePerLitre)).filter(n => !Number.isNaN(n));
  const uniquePrices = new Set(prices).size;

  return {
    first_number: Boolean(s.hasCalculated),
    price_watcher: checkIns.length >= 2 && uniquePrices >= 2,
    rate_protector: Boolean(s.hasProtectedRate),
    one_month_in: checkIns.length >= 4,
    quarter_tracked: checkIns.length >= 12,
    backed_up: Boolean(s.hasBackedUp)
  };
}

function nextMilestoneTarget(totalCheckIns) {
  const count = Math.max(0, Number(totalCheckIns) || 0);
  if (count < 4) return 4;
  if (count < 8) return 8;
  if (count < 12) return 12;
  return (Math.floor(count / 12) + 1) * 12;
}

function generateInsight(checkIns) {
  if (!Array.isArray(checkIns) || checkIns.length < 2) return null;

  let minEntry = checkIns[0];
  let maxEntry = checkIns[0];

  for (let i = 1; i < checkIns.length; i++) {
    const item = checkIns[i];
    if (item.costPerWorkHour < minEntry.costPerWorkHour) {
      minEntry = item;
    }
    if (item.costPerWorkHour > maxEntry.costPerWorkHour) {
      maxEntry = item;
    }
  }

  const fmt = (n) => Math.round(n).toLocaleString();

  if (minEntry.costPerWorkHour === maxEntry.costPerWorkHour) {
    return `Your hourly fuel cost has remained steady at ₦${fmt(minEntry.costPerWorkHour)} across all ${checkIns.length} recorded check-ins.`;
  }

  return `Your hourly fuel cost peaked at ₦${fmt(maxEntry.costPerWorkHour)} (week ${maxEntry.weekIndex}) and was lowest at ₦${fmt(minEntry.costPerWorkHour)} (week ${minEntry.weekIndex}).`;
}

function validateBackup(data) {
  if (!data || typeof data !== 'object') {
    return { valid: false, error: 'Backup data must be a valid JSON object.' };
  }

  if (data.version !== 2) {
    return { valid: false, error: 'Unsupported backup version. Expected version 2.' };
  }

  if (!data.setup || typeof data.setup !== 'object') {
    return { valid: false, error: 'Backup is missing required generator setup data.' };
  }

  const setupErrors = validate(data.setup);
  if (setupErrors.length > 0) {
    return { valid: false, error: `Invalid setup values: ${setupErrors[0]}` };
  }

  if (data.checkIns !== undefined && !Array.isArray(data.checkIns)) {
    return { valid: false, error: 'Check-in history must be an array.' };
  }

  if (Array.isArray(data.checkIns)) {
    for (const c of data.checkIns) {
      if (typeof c !== 'object' || c === null || typeof c.weekIndex !== 'number' || typeof c.pricePerLitre !== 'number' || typeof c.costPerWorkHour !== 'number') {
        return { valid: false, error: 'Malformed check-in record in history.' };
      }
    }
  }

  return { valid: true };
}

function migrateV1ToV2(v1Data) {
  if (!v1Data || typeof v1Data !== 'object') return null;

  return {
    version: 2,
    setup: {
      litresPerHour: v1Data.litresPerHour !== undefined ? v1Data.litresPerHour : '',
      hoursRunPerDay: v1Data.hoursRunPerDay !== undefined ? v1Data.hoursRunPerDay : '',
      pricePerLitre: v1Data.pricePerLitre !== undefined ? v1Data.pricePerLitre : '',
      workingDaysPerMonth: v1Data.workingDaysPerMonth !== undefined ? v1Data.workingDaysPerMonth : '',
      workingHoursPerDay: v1Data.workingHoursPerDay !== undefined ? v1Data.workingHoursPerDay : ''
    },
    hourlyRate: null,
    checkIns: [],
    milestones: {
      hasCalculated: Boolean(v1Data.litresPerHour && v1Data.pricePerLitre),
      hasProtectedRate: false,
      hasBackedUp: false
    }
  };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
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
  };
}
