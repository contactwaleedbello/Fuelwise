/**
 * Fuelwise Application Logic
 * Implements Journey 1 (guided 3-step setup) and Journey 2 (Results & Rate Protection).
 * Pure client-side, zero network requests, localStorage persistence.
 */

(function initFuelwiseApp() {
  'use strict';

  const STORAGE_KEY_V2 = 'fuelwise:v2';
  const STORAGE_KEY_V1 = 'fuelwise_saved_inputs';

  // Currency Formatter
  const nairaFormatter = new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 0
  });

  // DOM Elements - Wizard Navigation
  const flowContainer = document.getElementById('setup-flow');
  const resultsView = document.getElementById('results-view');
  const stepIndicator = document.getElementById('step-indicator');
  const progressFill = document.getElementById('progress-fill');
  const flowHeading = document.getElementById('flow-heading');

  const step1Pane = document.getElementById('step-1');
  const step2Pane = document.getElementById('step-2');
  const step3Pane = document.getElementById('step-3');

  const btnStep1Next = document.getElementById('step1-next');
  const btnStep2Back = document.getElementById('step2-back');
  const btnStep2Next = document.getElementById('step2-next');
  const btnStep3Back = document.getElementById('step3-back');
  const btnStep3Submit = document.getElementById('step3-submit');
  const btnEditSetup = document.getElementById('edit-setup-btn');

  // DOM Elements - Wizard Inputs
  const inputLitres = document.getElementById('litres-per-hour');
  const inputHoursRun = document.getElementById('hours-run');
  const inputDays = document.getElementById('working-days');
  const inputWorkHours = document.getElementById('working-hours');
  const inputPrice = document.getElementById('price-per-litre');

  // DOM Elements - Error Labels
  const errorLitres = document.getElementById('litres-error');
  const errorHoursRun = document.getElementById('hours-run-error');
  const errorDays = document.getElementById('days-error');
  const errorWorkHours = document.getElementById('work-hours-error');
  const errorPrice = document.getElementById('price-error');

  // DOM Elements - Example & Clear
  const btnExample = document.getElementById('example-btn');
  const exampleNotice = document.getElementById('example-notice');
  const btnClear = document.getElementById('clear-data-btn');

  // DOM Elements - Results ("Today")
  const heroCostPerHour = document.getElementById('hero-cost-per-hour');
  const heroExplanation = document.getElementById('hero-explanation');
  const resultDaily = document.getElementById('cost-per-day');
  const resultMonthly = document.getElementById('cost-per-month');

  // DOM Elements - Slider
  const sliderRise = document.getElementById('price-rise-slider');
  const labelRisePercent = document.getElementById('price-rise-percent');
  const resultProjected = document.getElementById('projected-cost-per-hour');

  // DOM Elements - Rate Protection
  const inputHourlyRate = document.getElementById('hourly-rate-input');
  const rateShareText = document.getElementById('rate-share-text');
  const rateQuoteText = document.getElementById('rate-quote-text');
  const btnCopyQuoteLine = document.getElementById('copy-quote-line-btn');
  const copyToast = document.getElementById('copy-toast');

  // State
  let currentStep = 1;
  let baseCostPerHour = 0;
  let baseDailyCost = 0;
  let baseMonthlyCost = 0;

  const appData = {
    version: 2,
    setup: {
      litresPerHour: '',
      hoursRunPerDay: '',
      pricePerLitre: '',
      workingDaysPerMonth: '',
      workingHoursPerDay: ''
    },
    hourlyRate: '',
    checkIns: [],
    milestones: {
      hasCalculated: false,
      hasProtectedRate: false,
      hasBackedUp: false
    }
  };

  const stepTitles = {
    1: 'Your generator',
    2: 'Your work week',
    3: "Today's fuel price"
  };

  // Local Storage Helpers
  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY_V2, JSON.stringify(appData));
    } catch (err) {
      // Storage unavailable or disabled
    }
  }

  function loadState() {
    try {
      const v2Data = localStorage.getItem(STORAGE_KEY_V2);
      if (v2Data) {
        const parsed = JSON.parse(v2Data);
        if (parsed && parsed.version === 2) {
          Object.assign(appData, parsed);
          return true;
        }
      }

      // Check for v1 data migration
      const v1Data = localStorage.getItem(STORAGE_KEY_V1);
      if (v1Data) {
        const parsedV1 = JSON.parse(v1Data);
        const migrated = migrateV1ToV2(parsedV1);
        if (migrated) {
          Object.assign(appData, migrated);
          saveState();
          return true;
        }
      }
    } catch (err) {
      // Storage corrupted or disabled
    }
    return false;
  }

  function clearState() {
    try {
      localStorage.removeItem(STORAGE_KEY_V2);
      localStorage.removeItem(STORAGE_KEY_V1);
    } catch (err) {}
  }

  // Error Display Helpers
  function clearFieldError(inputEl, errorEl) {
    if (inputEl) inputEl.classList.remove('has-error');
    if (errorEl) {
      errorEl.textContent = '';
      errorEl.classList.add('hidden');
    }
  }

  function setFieldError(inputEl, errorEl, message) {
    if (inputEl) inputEl.classList.add('has-error');
    if (errorEl) {
      errorEl.textContent = message;
      errorEl.classList.remove('hidden');
    }
  }

  // Step Validation
  function validateStep1() {
    clearFieldError(inputLitres, errorLitres);
    const val = inputLitres.value.trim();
    if (!val || Number(val) <= 0 || Number.isNaN(Number(val))) {
      setFieldError(inputLitres, errorLitres, 'Litres per hour: enter a number greater than 0.');
      return false;
    }
    appData.setup.litresPerHour = val;
    return true;
  }

  function validateStep2() {
    let valid = true;
    clearFieldError(inputHoursRun, errorHoursRun);
    clearFieldError(inputDays, errorDays);
    clearFieldError(inputWorkHours, errorWorkHours);

    const hours = inputHoursRun.value.trim();
    if (!hours || Number.isNaN(Number(hours)) || Number(hours) <= 0) {
      setFieldError(inputHoursRun, errorHoursRun, 'Hours run per day: enter a number greater than 0.');
      valid = false;
    } else if (Number(hours) > 24) {
      setFieldError(inputHoursRun, errorHoursRun, 'Hours run per day: must be 24 or less.');
      valid = false;
    }

    const days = inputDays.value.trim();
    if (!days || Number.isNaN(Number(days)) || Number(days) <= 0) {
      setFieldError(inputDays, errorDays, 'Working days per month: enter a number greater than 0.');
      valid = false;
    } else if (Number(days) > 31) {
      setFieldError(inputDays, errorDays, 'Working days per month: must be 31 or less.');
      valid = false;
    }

    const workHours = inputWorkHours.value.trim();
    if (!workHours || Number.isNaN(Number(workHours)) || Number(workHours) <= 0) {
      setFieldError(inputWorkHours, errorWorkHours, 'Working hours per day: enter a number greater than 0.');
      valid = false;
    } else if (Number(workHours) > 24) {
      setFieldError(inputWorkHours, errorWorkHours, 'Working hours per day: must be 24 or less.');
      valid = false;
    }

    if (valid) {
      appData.setup.hoursRunPerDay = hours;
      appData.setup.workingDaysPerMonth = days;
      appData.setup.workingHoursPerDay = workHours;
    }
    return valid;
  }

  function validateStep3() {
    clearFieldError(inputPrice, errorPrice);
    const price = inputPrice.value.trim();
    if (!price || Number(price) <= 0 || Number.isNaN(Number(price))) {
      setFieldError(inputPrice, errorPrice, 'Price per litre: enter a number greater than 0.');
      return false;
    }
    appData.setup.pricePerLitre = price;
    return true;
  }

  // Wizard Navigation
  function goToStep(step) {
    currentStep = step;
    stepIndicator.textContent = `Step ${step} of 3`;
    progressFill.style.width = `${(step / 3) * 100}%`;
    flowHeading.textContent = stepTitles[step];

    step1Pane.classList.toggle('hidden', step !== 1);
    step2Pane.classList.toggle('hidden', step !== 2);
    step3Pane.classList.toggle('hidden', step !== 3);

    const firstInput = [inputLitres, inputHoursRun, inputPrice][step - 1];
    if (firstInput) firstInput.focus();
  }

  // Subtle count-up animation for the hero number
  function animateHeroNumber(targetValue) {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      heroCostPerHour.textContent = nairaFormatter.format(targetValue);
      return;
    }

    const duration = 350;
    const startValue = 0;
    const startTime = performance.now();

    function step(now) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeOutProgress = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(startValue + (targetValue - startValue) * easeOutProgress);

      heroCostPerHour.textContent = nairaFormatter.format(current);

      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        heroCostPerHour.textContent = nairaFormatter.format(targetValue);
      }
    }

    requestAnimationFrame(step);
  }

  // Render Result Screen ("Today")
  function renderResults() {
    const litres = Number(appData.setup.litresPerHour);
    const hours = Number(appData.setup.hoursRunPerDay);
    const price = Number(appData.setup.pricePerLitre);
    const days = Number(appData.setup.workingDaysPerMonth);
    const workHours = Number(appData.setup.workingHoursPerDay);

    baseDailyCost = dailyCost(litres, hours, price);
    baseMonthlyCost = monthlyCost(baseDailyCost, days);
    baseCostPerHour = costPerWorkHour(baseMonthlyCost, days, workHours);

    // Update hero and sub-results
    animateHeroNumber(baseCostPerHour);

    const totalWorkHoursMonth = Math.round(days * workHours);
    heroExplanation.textContent = `Based on ${litres} L/hr running ${hours} hrs/day at ₦${price.toLocaleString()}/L across ${totalWorkHoursMonth} monthly working hours.`;

    resultDaily.textContent = nairaFormatter.format(baseDailyCost);
    resultMonthly.textContent = nairaFormatter.format(baseMonthlyCost);

    // Update Slider
    updateSlider();

    // Update Rate Protection
    updateRateProtection();

    // Mark milestone
    appData.milestones.hasCalculated = true;
    saveState();

    // Show results view
    flowContainer.classList.add('hidden');
    resultsView.classList.remove('hidden');
  }

  function updateSlider() {
    const risePercent = Number(sliderRise.value);
    labelRisePercent.textContent = `+${risePercent}%`;

    const projected = baseCostPerHour * (1 + risePercent / 100);
    resultProjected.textContent = nairaFormatter.format(projected);
  }

  function updateRateProtection() {
    const rawRate = inputHourlyRate.value.trim();
    const rate = Number(rawRate);

    if (!rawRate || Number.isNaN(rate) || rate <= 0) {
      rateShareText.textContent = 'Enter your rate to see the fuel share.';
      rateQuoteText.textContent = 'See what to quote to protect your take-home.';
      btnCopyQuoteLine.disabled = true;
      return;
    }

    appData.hourlyRate = rawRate;
    appData.milestones.hasProtectedRate = true;
    saveState();

    const share = powerShare(baseCostPerHour, rate);
    const needed = neededQuote(baseCostPerHour, rate);

    const formattedShare = share % 1 === 0 ? share.toString() : share.toFixed(1);
    rateShareText.textContent = `That's ${formattedShare}% of your hourly rate.`;
    rateQuoteText.textContent = `Quote ₦${Math.round(needed).toLocaleString()} to take home ₦${Math.round(rate).toLocaleString()}/hr after fuel.`;

    btnCopyQuoteLine.disabled = false;
  }

  function copyQuoteLine() {
    const costText = nairaFormatter.format(baseCostPerHour);
    const textToCopy = `My rate includes ${costText} per hour for power costs.`;

    function showToast() {
      if (!copyToast) return;
      copyToast.classList.remove('hidden');
      setTimeout(() => {
        copyToast.classList.add('hidden');
      }, 2000);
    }

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(textToCopy).then(showToast).catch(() => {
        fallbackCopy(textToCopy, showToast);
      });
    } else {
      fallbackCopy(textToCopy, showToast);
    }
  }

  function fallbackCopy(text, callback) {
    try {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      if (callback) callback();
    } catch (err) {}
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

    appData.setup = {
      litresPerHour: '1.5',
      hoursRunPerDay: '10',
      pricePerLitre: '1000',
      workingDaysPerMonth: '26',
      workingHoursPerDay: '8'
    };
  }

  function clearAllData() {
    inputLitres.value = '';
    inputHoursRun.value = '';
    inputDays.value = '';
    inputWorkHours.value = '';
    inputPrice.value = '';
    inputHourlyRate.value = '';
    sliderRise.value = '0';

    if (exampleNotice) exampleNotice.classList.add('hidden');

    clearFieldError(inputLitres, errorLitres);
    clearFieldError(inputHoursRun, errorHoursRun);
    clearFieldError(inputDays, errorDays);
    clearFieldError(inputWorkHours, errorWorkHours);
    clearFieldError(inputPrice, errorPrice);

    clearState();

    appData.setup = {
      litresPerHour: '',
      hoursRunPerDay: '',
      pricePerLitre: '',
      workingDaysPerMonth: '',
      workingHoursPerDay: ''
    };
    appData.hourlyRate = '';
    appData.checkIns = [];
    appData.milestones = { hasCalculated: false, hasProtectedRate: false, hasBackedUp: false };

    resultsView.classList.add('hidden');
    flowContainer.classList.remove('hidden');
    goToStep(1);
  }

  // Attach Event Listeners
  btnStep1Next.addEventListener('click', () => {
    if (validateStep1()) goToStep(2);
  });

  btnStep2Back.addEventListener('click', () => goToStep(1));

  btnStep2Next.addEventListener('click', () => {
    if (validateStep2()) goToStep(3);
  });

  btnStep3Back.addEventListener('click', () => goToStep(2));

  btnStep3Submit.addEventListener('click', () => {
    if (validateStep3()) renderResults();
  });

  btnEditSetup.addEventListener('click', () => {
    resultsView.classList.add('hidden');
    flowContainer.classList.remove('hidden');
    goToStep(1);
  });

  btnExample.addEventListener('click', populateExample);

  inputLitres.addEventListener('input', () => {
    if (exampleNotice) exampleNotice.classList.add('hidden');
    clearFieldError(inputLitres, errorLitres);
  });

  sliderRise.addEventListener('input', updateSlider);

  inputHourlyRate.addEventListener('input', updateRateProtection);

  btnCopyQuoteLine.addEventListener('click', copyQuoteLine);

  btnClear.addEventListener('click', clearAllData);

  // Initialize on page load
  const hasLoaded = loadState();
  if (hasLoaded && appData.setup.litresPerHour && appData.setup.pricePerLitre) {
    inputLitres.value = appData.setup.litresPerHour;
    inputHoursRun.value = appData.setup.hoursRunPerDay;
    inputDays.value = appData.setup.workingDaysPerMonth;
    inputWorkHours.value = appData.setup.workingHoursPerDay;
    inputPrice.value = appData.setup.pricePerLitre;
    if (appData.hourlyRate) inputHourlyRate.value = appData.hourlyRate;

    renderResults();
  } else {
    goToStep(1);
  }
})();
