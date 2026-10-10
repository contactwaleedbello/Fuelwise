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
    validate
  };
}
