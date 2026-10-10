/**
 * DOM wiring and event handling for Fuelwise.
 * Connects pure functions in calc.js with the UI and persists numbers locally.
 */

(function initFuelwise() {
  'use strict';

  const STORAGE_KEY = 'fuelwise_saved_inputs';

  // Currency formatter for Nigerian Naira
  const nairaFormatter = new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 0
  });

  // DOM Elements - Inputs
  const inputLitres = document.getElementById('litres-per-hour');
  const inputHoursRun = document.getElementById('hours-run');
  const inputPrice = document.getElementById('price-per-litre');
  const inputDays = document.getElementById('working-days');
  const inputWorkHours = document.getElementById('working-hours');

  // DOM Elements - Field Errors
  const errorLitres = document.getElementById('litres-error');
  const errorHoursRun = document.getElementById('hours-run-error');
  const errorPrice = document.getElementById('price-error');
  const errorDays = document.getElementById('days-error');
  const errorWorkHours = document.getElementById('work-hours-error');

  // DOM Elements - Buttons & Notice
  const btnExample = document.getElementById('example-btn');
  const btnClear = document.getElementById('clear-btn');
  const exampleNotice = document.getElementById('example-notice');

  // DOM Elements - Results
  const resultPerHour = document.getElementById('cost-per-hour');
  const resultDaily = document.getElementById('cost-per-day');
  const resultMonthly = document.getElementById('cost-per-month');

  // DOM Elements - Slider
  const sliderRise = document.getElementById('price-rise-slider');
  const labelRisePercent = document.getElementById('price-rise-percent');
  const resultProjected = document.getElementById('projected-cost-per-hour');

  // State
  let currentBaseCostPerHour = null;

  // Field mapping for validation errors
  const fieldMap = {
    'Litres per hour': { input: inputLitres, errorEl: errorLitres },
    'Hours run per day': { input: inputHoursRun, errorEl: errorHoursRun },
    'Price per litre': { input: inputPrice, errorEl: errorPrice },
    'Working days per month': { input: inputDays, errorEl: errorDays },
    'Working hours per day': { input: inputWorkHours, errorEl: errorWorkHours }
  };

  function getRawInputs() {
    return {
      litresPerHour: inputLitres.value.trim(),
      hoursRunPerDay: inputHoursRun.value.trim(),
      pricePerLitre: inputPrice.value.trim(),
      workingDaysPerMonth: inputDays.value.trim(),
      workingHoursPerDay: inputWorkHours.value.trim()
    };
  }

  function saveInputsToStorage(inputs) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(inputs));
    } catch (err) {
      // Storage unavailable, quota exceeded, or disabled in private browsing.
      // App continues working seamlessly.
    }
  }

  function loadInputsFromStorage() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (err) {
      // Storage read failed, fallback to empty
      return null;
    }
    return null;
  }

  function clearInputsFromStorage() {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (err) {
      // Storage removal failed, ignore
    }
  }

  function clearErrors() {
    for (const key of Object.keys(fieldMap)) {
      const { input, errorEl } = fieldMap[key];
      if (input) input.classList.remove('has-error');
      if (errorEl) {
        errorEl.textContent = '';
        errorEl.classList.add('hidden');
      }
    }
  }

  function displayErrors(errorMessages) {
    clearErrors();
    for (const msg of errorMessages) {
      for (const [fieldName, config] of Object.entries(fieldMap)) {
        if (msg.startsWith(fieldName)) {
          config.input.classList.add('has-error');
          config.errorEl.textContent = msg;
          config.errorEl.classList.remove('hidden');
          break;
        }
      }
    }
  }

  function updateSliderProjectedCost() {
    const risePercent = Number(sliderRise.value);
    labelRisePercent.textContent = `+${risePercent}%`;

    if (currentBaseCostPerHour === null) {
      resultProjected.textContent = '—';
      return;
    }

    const projectedPerHour = currentBaseCostPerHour * (1 + risePercent / 100);
    resultProjected.textContent = nairaFormatter.format(projectedPerHour);
  }

  function calculateAndRender() {
    const raw = getRawInputs();

    // If all fields are empty, keep clean neutral state
    const allEmpty = Object.values(raw).every(v => v === '');
    if (allEmpty) {
      clearErrors();
      currentBaseCostPerHour = null;
      resultPerHour.textContent = '—';
      resultDaily.textContent = '—';
      resultMonthly.textContent = '—';
      updateSliderProjectedCost();
      return;
    }

    saveInputsToStorage(raw);

    const errors = validate(raw);

    if (errors.length > 0) {
      displayErrors(errors);
      currentBaseCostPerHour = null;
      resultPerHour.textContent = '—';
      resultDaily.textContent = '—';
      resultMonthly.textContent = '—';
      updateSliderProjectedCost();
      return;
    }

    // Valid inputs
    clearErrors();

    const litres = Number(raw.litresPerHour);
    const hoursRun = Number(raw.hoursRunPerDay);
    const price = Number(raw.pricePerLitre);
    const days = Number(raw.workingDaysPerMonth);
    const workHours = Number(raw.workingHoursPerDay);

    const daily = dailyCost(litres, hoursRun, price);
    const monthly = monthlyCost(daily, days);
    const perWorkHour = costPerWorkHour(monthly, days, workHours);

    currentBaseCostPerHour = perWorkHour;

    resultDaily.textContent = nairaFormatter.format(daily);
    resultMonthly.textContent = nairaFormatter.format(monthly);
    resultPerHour.textContent = nairaFormatter.format(perWorkHour);

    updateSliderProjectedCost();
  }

  function populateExample() {
    inputLitres.value = '1.5';
    inputHoursRun.value = '10';
    inputPrice.value = '1000';
    inputDays.value = '26';
    inputWorkHours.value = '8';

    if (exampleNotice) {
      exampleNotice.classList.remove('hidden');
    }

    calculateAndRender();
  }

  function clearAll() {
    inputLitres.value = '';
    inputHoursRun.value = '';
    inputPrice.value = '';
    inputDays.value = '';
    inputWorkHours.value = '';

    sliderRise.value = '0';
    if (exampleNotice) {
      exampleNotice.classList.add('hidden');
    }

    clearInputsFromStorage();
    clearErrors();
    currentBaseCostPerHour = null;
    resultPerHour.textContent = '—';
    resultDaily.textContent = '—';
    resultMonthly.textContent = '—';
    updateSliderProjectedCost();
  }

  // Restore saved inputs if available
  function restoreSavedInputs() {
    const saved = loadInputsFromStorage();
    if (!saved) return;

    if (saved.litresPerHour !== undefined) inputLitres.value = saved.litresPerHour;
    if (saved.hoursRunPerDay !== undefined) inputHoursRun.value = saved.hoursRunPerDay;
    if (saved.pricePerLitre !== undefined) inputPrice.value = saved.pricePerLitre;
    if (saved.workingDaysPerMonth !== undefined) inputDays.value = saved.workingDaysPerMonth;
    if (saved.workingHoursPerDay !== undefined) inputWorkHours.value = saved.workingHoursPerDay;

    calculateAndRender();
  }

  // Event Listeners
  const inputElements = [inputLitres, inputHoursRun, inputPrice, inputDays, inputWorkHours];
  for (const el of inputElements) {
    if (el) {
      el.addEventListener('input', () => {
        if (exampleNotice && !exampleNotice.classList.contains('hidden')) {
          exampleNotice.classList.add('hidden');
        }
        calculateAndRender();
      });
    }
  }

  if (sliderRise) {
    sliderRise.addEventListener('input', updateSliderProjectedCost);
  }

  if (btnExample) {
    btnExample.addEventListener('click', populateExample);
  }

  if (btnClear) {
    btnClear.addEventListener('click', clearAll);
  }

  // Initialize
  restoreSavedInputs();
})();
