/**
 * Fuelwise Application Logic
 * Implements Journeys 1-4, Gamification (Streak & Milestones), Data Safety, and Calendar Reminder.
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
  const stepPercent = document.getElementById('step-percent');
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

  // DOM Elements - Journey 3: Weekly Check-In
  const formCheckin = document.getElementById('checkin-form');
  const inputCheckinPrice = document.getElementById('checkin-price-input');
  const errorCheckin = document.getElementById('checkin-error');
  const feedbackCheckin = document.getElementById('checkin-feedback');
  const textCheckinChange = document.getElementById('checkin-change-text');

  // DOM Elements - Journey 4: History & Chart
  const historyEmpty = document.getElementById('history-empty');
  const btnStartCheckin = document.getElementById('start-checkin-btn');
  const historySingle = document.getElementById('history-single');
  const historyChartWrap = document.getElementById('history-chart-wrap');
  const svgContainer = document.getElementById('svg-chart-container');
  const historySummary = document.getElementById('history-summary');
  const historyTableWrap = document.getElementById('history-table-wrap');
  const historyTableBody = document.getElementById('history-table-body');
  const btnToggleTable = document.getElementById('toggle-table-btn');

  // DOM Elements - Gamification
  const streakText = document.getElementById('streak-text');
  const weeksTrackedLabel = document.getElementById('weeks-tracked-label');
  const nextTargetLabel = document.getElementById('next-target-label');
  const milestoneProgressFill = document.getElementById('milestone-progress-fill');
  const streakEncouragement = document.getElementById('streak-encouragement');
  const milestonesGrid = document.getElementById('milestones-grid');

  // DOM Elements - Data Safety & Portability
  const btnDownloadBackup = document.getElementById('download-backup-btn');
  const inputRestoreFile = document.getElementById('restore-file-input');
  const btnReminderIcs = document.getElementById('reminder-ics-btn');
  const storageStatusMessage = document.getElementById('storage-status-message');
  const btnClearAllData = document.getElementById('clear-all-data-btn');
  const modalClearConfirm = document.getElementById('clear-confirm-modal');
  const btnCancelClear = document.getElementById('cancel-clear-btn');
  const btnConfirmClear = document.getElementById('confirm-clear-btn');

  // DOM Elements - Theme Toggle
  const btnThemeToggle = document.getElementById('theme-toggle-btn');
  const iconMoon = document.getElementById('icon-moon');
  const iconSun = document.getElementById('icon-sun');
  const themeToggleText = document.getElementById('theme-toggle-text');

  function applyTheme(theme) {
    if (theme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
      if (iconMoon) iconMoon.classList.add('hidden');
      if (iconSun) iconSun.classList.remove('hidden');
      if (themeToggleText) themeToggleText.textContent = 'Light mode';
      if (btnThemeToggle) btnThemeToggle.setAttribute('aria-label', 'Switch to light theme');
    } else {
      document.documentElement.removeAttribute('data-theme');
      if (iconMoon) iconMoon.classList.remove('hidden');
      if (iconSun) iconSun.classList.add('hidden');
      if (themeToggleText) themeToggleText.textContent = 'Dark mode';
      if (btnThemeToggle) btnThemeToggle.setAttribute('aria-label', 'Switch to dark theme');
    }
    try {
      localStorage.setItem('fuelwise:theme', theme);
    } catch (err) {}
  }

  function initTheme() {
    let activeTheme = 'light'; // Light mode is default
    try {
      const saved = localStorage.getItem('fuelwise:theme');
      if (saved === 'dark') {
        activeTheme = 'dark';
      }
    } catch (err) {}
    applyTheme(activeTheme);
  }

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

  const viewTitles = {
    home: 'Fuelwise — Generator Cost Calculator',
    step1: 'Fuelwise — Your Generator (Step 1 of 3)',
    step2: 'Fuelwise — Your Work Week (Step 2 of 3)',
    step3: "Fuelwise — Today's Fuel Price (Step 3 of 3)",
    results: 'Fuelwise — Generator Cost Breakdown',
    checkin: 'Fuelwise — Weekly Check-In'
  };

  function updatePageTitle(viewKey) {
    if (viewTitles[viewKey]) {
      document.title = viewTitles[viewKey];
    }
  }

  function getCurrentWeekIndex() {
    return Math.floor(Date.now() / (1000 * 60 * 60 * 24 * 7));
  }

  // Local Storage Helpers
  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY_V2, JSON.stringify(appData));
    } catch (err) {
      if (storageStatusMessage) {
        storageStatusMessage.textContent = "Your numbers can't be saved on this browser.";
        storageStatusMessage.className = 'type-body status-note error';
        storageStatusMessage.classList.remove('hidden');
      }
    }
  }

  function loadState() {
    try {
      const v2Data = localStorage.getItem(STORAGE_KEY_V2);
      if (v2Data) {
        const parsed = JSON.parse(v2Data);
        if (parsed && parsed.version === 2) {
          Object.assign(appData, parsed);
          if (!Array.isArray(appData.checkIns)) appData.checkIns = [];
          if (!appData.milestones) appData.milestones = { hasCalculated: false, hasProtectedRate: false, hasBackedUp: false };
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
    const pct = Math.round((step / 3) * 100);
    stepPercent.textContent = `${pct}%`;
    progressFill.style.width = `${pct}%`;
    flowHeading.textContent = stepTitles[step];

    step1Pane.classList.toggle('hidden', step !== 1);
    step2Pane.classList.toggle('hidden', step !== 2);
    step3Pane.classList.toggle('hidden', step !== 3);

    updatePageTitle('step' + step);

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

    // Update History Chart and Table
    renderHistory();

    // Update Gamification (Streak & Milestones)
    renderGamification();

    // Mark milestone
    appData.milestones.hasCalculated = true;
    saveState();

    // Show results view
    flowContainer.classList.add('hidden');
    resultsView.classList.remove('hidden');
    updatePageTitle('results');
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
    renderGamification();
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

  // ==========================================================================
  // Journey 3: Weekly Check-In Logic
  // ==========================================================================
  function handleCheckinSubmit(e) {
    e.preventDefault();
    clearFieldError(inputCheckinPrice, errorCheckin);

    const raw = inputCheckinPrice.value.trim();
    const newPrice = Number(raw);

    if (!raw || Number.isNaN(newPrice) || newPrice <= 0) {
      setFieldError(inputCheckinPrice, errorCheckin, 'Price per litre: enter a number greater than 0.');
      return;
    }

    const litres = Number(appData.setup.litresPerHour);
    const hours = Number(appData.setup.hoursRunPerDay);
    const days = Number(appData.setup.workingDaysPerMonth);
    const workHours = Number(appData.setup.workingHoursPerDay);

    const newDaily = dailyCost(litres, hours, newPrice);
    const newMonthly = monthlyCost(newDaily, days);
    const newCostPerHour = costPerWorkHour(newMonthly, days, workHours);

    const currentWeek = getCurrentWeekIndex();
    const existingIndex = appData.checkIns.findIndex(c => c.weekIndex === currentWeek);
    const prevEntry = existingIndex > 0
      ? appData.checkIns[existingIndex - 1]
      : (appData.checkIns.length > 0 ? appData.checkIns[appData.checkIns.length - 1] : null);

    // Compute change message
    if (prevEntry) {
      const { diff, percent } = checkInChange(prevEntry.costPerWorkHour, newCostPerHour);
      const absDiff = Math.abs(diff);
      const absPercent = Math.abs(percent).toFixed(1);

      if (diff > 0) {
        textCheckinChange.textContent = `Up ₦${Math.round(absDiff).toLocaleString()} an hour since last check-in (+${absPercent}%).`;
      } else if (diff < 0) {
        textCheckinChange.textContent = `Down ₦${Math.round(absDiff).toLocaleString()} an hour since last check-in (-${absPercent}%).`;
      } else {
        textCheckinChange.textContent = `Unchanged from last check-in (₦${Math.round(newCostPerHour).toLocaleString()}/hr).`;
      }
    } else {
      textCheckinChange.textContent = `Recorded at ₦${Math.round(newCostPerHour).toLocaleString()} per working hour. Check in next week to see your change.`;
    }

    feedbackCheckin.classList.remove('hidden');

    // Update or append check-in record
    if (existingIndex !== -1) {
      appData.checkIns[existingIndex].pricePerLitre = newPrice;
      appData.checkIns[existingIndex].costPerWorkHour = newCostPerHour;
    } else {
      appData.checkIns.push({
        weekIndex: currentWeek,
        pricePerLitre: newPrice,
        costPerWorkHour: newCostPerHour
      });
    }

    // Sort check-ins ascending by weekIndex
    appData.checkIns.sort((a, b) => a.weekIndex - b.weekIndex);

    // Update current price
    appData.setup.pricePerLitre = newPrice.toString();
    inputPrice.value = newPrice.toString();
    inputCheckinPrice.value = '';

    // Re-render and persist
    renderResults();
  }

  // ==========================================================================
  // Journey 4: History & Hand-Built SVG Line Chart
  // ==========================================================================
  function renderHistory() {
    const list = appData.checkIns || [];

    // Render Table Rows
    historyTableBody.innerHTML = '';
    for (let i = 0; i < list.length; i++) {
      const item = list[i];
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>Week ${i + 1}</td>
        <td>₦${item.pricePerLitre.toLocaleString()}</td>
        <td>₦${Math.round(item.costPerWorkHour).toLocaleString()}/hr</td>
      `;
      historyTableBody.appendChild(tr);
    }

    if (list.length === 0) {
      historyEmpty.classList.remove('hidden');
      historySingle.classList.add('hidden');
      historyChartWrap.classList.add('hidden');
      return;
    }

    if (list.length === 1) {
      historyEmpty.classList.add('hidden');
      historySingle.classList.remove('hidden');
      historyChartWrap.classList.add('hidden');
      return;
    }

    // >= 2 Check-ins: Render SVG Line Chart
    historyEmpty.classList.add('hidden');
    historySingle.classList.add('hidden');
    historyChartWrap.classList.remove('hidden');

    const width = 500;
    const height = 200;
    const paddingLeft = 60;
    const paddingRight = 30;
    const paddingTop = 25;
    const paddingBottom = 40;

    const plotWidth = width - paddingLeft - paddingRight;
    const plotHeight = height - paddingTop - paddingBottom;

    const values = list.map(c => c.costPerWorkHour);
    let minVal = Math.min(...values);
    let maxVal = Math.max(...values);

    if (minVal === maxVal) {
      minVal = minVal * 0.9;
      maxVal = maxVal * 1.1;
    }

    const range = maxVal - minVal || 1;

    // Calculate Coordinates
    const points = list.map((c, i) => {
      const x = paddingLeft + (i / (list.length - 1)) * plotWidth;
      const y = paddingTop + plotHeight - ((c.costPerWorkHour - minVal) / range) * plotHeight;
      return { x, y, c, index: i + 1 };
    });

    const polylinePoints = points.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');

    // SVG String Construction
    let svgHtml = `
      <svg class="history-svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="Line chart showing power cost per working hour across check-ins">
        <title>Fuel Cost per Work Hour Trend</title>
        <!-- Horizontal Grid Lines & Labels -->
        <line x1="${paddingLeft}" y1="${paddingTop}" x2="${width - paddingRight}" y2="${paddingTop}" stroke="var(--border-color)" stroke-dasharray="3 3" />
        <text x="${paddingLeft - 8}" y="${paddingTop + 4}" font-size="11" fill="var(--text-secondary)" text-anchor="end">₦${Math.round(maxVal).toLocaleString()}</text>

        <line x1="${paddingLeft}" y1="${paddingTop + plotHeight / 2}" x2="${width - paddingRight}" y2="${paddingTop + plotHeight / 2}" stroke="var(--border-color)" stroke-dasharray="3 3" />
        <text x="${paddingLeft - 8}" y="${paddingTop + plotHeight / 2 + 4}" font-size="11" fill="var(--text-secondary)" text-anchor="end">₦${Math.round((maxVal + minVal) / 2).toLocaleString()}</text>

        <line x1="${paddingLeft}" y1="${paddingTop + plotHeight}" x2="${width - paddingRight}" y2="${paddingTop + plotHeight}" stroke="var(--border-color)" />
        <text x="${paddingLeft - 8}" y="${paddingTop + plotHeight + 4}" font-size="11" fill="var(--text-secondary)" text-anchor="end">₦${Math.round(minVal).toLocaleString()}</text>

        <!-- Trend Polyline -->
        <polyline points="${polylinePoints}" fill="none" stroke="var(--accent)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
    `;

    // Data Points and X-Axis Labels
    for (const pt of points) {
      svgHtml += `
        <circle cx="${pt.x.toFixed(1)}" cy="${pt.y.toFixed(1)}" r="5" fill="var(--bg-card)" stroke="var(--accent)" stroke-width="3">
          <title>Week ${pt.index}: ₦${Math.round(pt.c.costPerWorkHour).toLocaleString()}/hr (Price: ₦${pt.c.pricePerLitre})</title>
        </circle>
        <text x="${pt.x.toFixed(1)}" y="${height - 12}" font-size="11" fill="var(--text-secondary)" text-anchor="middle">W${pt.index}</text>
      `;
    }

    svgHtml += `</svg>`;
    svgContainer.innerHTML = svgHtml;

    // Insight summary line
    const insight = generateInsight(list);
    historySummary.textContent = insight || `Tracking ${list.length} check-in weeks.`;
  }

  function toggleHistoryTable() {
    const isHidden = historyTableWrap.classList.contains('hidden');
    historyTableWrap.classList.toggle('hidden', !isHidden);
    btnToggleTable.textContent = isHidden ? 'Hide table' : 'Show as table';
  }

  // ==========================================================================
  // Phase D: Gamification (Progress, Streak & Milestones)
  // ==========================================================================
  function renderGamification() {
    const list = appData.checkIns || [];
    const totalWeeks = list.length;
    const currentWeek = getCurrentWeekIndex();
    const weekIndexes = list.map(c => c.weekIndex);

    // Compute Streak
    const streak = currentStreak(weekIndexes, currentWeek);
    streakText.textContent = `Current streak: ${streak} week${streak === 1 ? '' : 's'}`;

    if (streak === 0 && totalWeeks > 0) {
      streakEncouragement.textContent = `Pick it back up this week. Your ${totalWeeks} tracked week${totalWeeks === 1 ? '' : 's'} are still here.`;
      streakEncouragement.classList.remove('hidden');
    } else {
      streakEncouragement.classList.add('hidden');
    }

    // Next Target Milestone
    const nextTarget = nextMilestoneTarget(totalWeeks);
    weeksTrackedLabel.textContent = `${totalWeeks} week${totalWeeks === 1 ? '' : 's'} tracked`;
    nextTargetLabel.textContent = `Next milestone: ${nextTarget} weeks`;

    const progressPct = Math.min(100, Math.round((totalWeeks / nextTarget) * 100));
    milestoneProgressFill.style.width = `${progressPct}%`;

    // Evaluate Milestones
    const evaluated = evaluateMilestones(appData);
    milestonesGrid.innerHTML = '';

    const milestoneIcons = {
      first_number: '⚡',
      price_watcher: '📊',
      rate_protector: '🛡️',
      one_month_in: '🗓️',
      quarter_tracked: '🎯',
      backed_up: '💾'
    };

    for (const def of MILESTONE_DEFS) {
      const isUnlocked = Boolean(evaluated[def.id]);
      const card = document.createElement('div');
      card.className = `milestone-badge-card ${isUnlocked ? 'unlocked' : 'locked'}`;
      card.setAttribute('role', 'article');
      card.setAttribute('aria-label', `${def.title}: ${isUnlocked ? 'Unlocked' : 'Locked'}`);

      card.innerHTML = `
        <div class="milestone-icon-wrap" aria-hidden="true">${milestoneIcons[def.id] || '★'}</div>
        <div class="milestone-badge-content">
          <div class="milestone-title-row">
            <span class="milestone-title">${def.title}</span>
            <span class="milestone-status-tag">${isUnlocked ? 'Unlocked' : 'Locked'}</span>
          </div>
          <p class="milestone-desc">${def.desc}</p>
        </div>
      `;

      milestonesGrid.appendChild(card);
    }
  }

  // ==========================================================================
  // Phase E: Data Safety & Portability
  // ==========================================================================
  function downloadBackup() {
    const jsonStr = JSON.stringify(appData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fuelwise-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    appData.milestones.hasBackedUp = true;
    saveState();
    renderGamification();

    if (storageStatusMessage) {
      storageStatusMessage.textContent = 'Backup file downloaded successfully.';
      storageStatusMessage.className = 'type-body status-note success';
      storageStatusMessage.classList.remove('hidden');
      setTimeout(() => storageStatusMessage.classList.add('hidden'), 4000);
    }
  }

  function handleRestoreFile(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(event) {
      try {
        const parsed = JSON.parse(event.target.result);
        const res = validateBackup(parsed);
        if (!res.valid) {
          if (storageStatusMessage) {
            storageStatusMessage.textContent = `Restore failed: ${res.error}`;
            storageStatusMessage.className = 'type-body status-note error';
            storageStatusMessage.classList.remove('hidden');
          }
          return;
        }

        Object.assign(appData, parsed);
        saveState();
        renderResults();

        if (storageStatusMessage) {
          storageStatusMessage.textContent = 'Data successfully restored from backup file.';
          storageStatusMessage.className = 'type-body status-note success';
          storageStatusMessage.classList.remove('hidden');
          setTimeout(() => storageStatusMessage.classList.add('hidden'), 4000);
        }
      } catch (err) {
        if (storageStatusMessage) {
          storageStatusMessage.textContent = 'Invalid JSON file. Please provide a valid Fuelwise backup.';
          storageStatusMessage.className = 'type-body status-note error';
          storageStatusMessage.classList.remove('hidden');
        }
      }
    };
    reader.readAsText(file);
    inputRestoreFile.value = '';
  }

  function downloadCalendarReminder() {
    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Fuelwise//Weekly Fuel Price Check//EN',
      'CALSCALE:GREGORIAN',
      'BEGIN:VEVENT',
      'SUMMARY:Update my fuel price in Fuelwise',
      'DESCRIPTION:Fuel prices change often. Spend 10 seconds updating Fuelwise to keep your hourly freelance quote honest.',
      'RRULE:FREQ=WEEKLY;BYDAY=MO',
      'STATUS:CONFIRMED',
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'fuelwise-weekly-reminder.ics';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    if (storageStatusMessage) {
      storageStatusMessage.textContent = 'Calendar reminder file (.ics) downloaded. Open it to add a weekly event.';
      storageStatusMessage.className = 'type-body status-note success';
      storageStatusMessage.classList.remove('hidden');
      setTimeout(() => storageStatusMessage.classList.add('hidden'), 5000);
    }
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

  function openClearModal() {
    modalClearConfirm.classList.remove('hidden');
  }

  function closeClearModal() {
    modalClearConfirm.classList.add('hidden');
  }

  function performClearAllData() {
    closeClearModal();

    inputLitres.value = '';
    inputHoursRun.value = '';
    inputDays.value = '';
    inputWorkHours.value = '';
    inputPrice.value = '';
    inputHourlyRate.value = '';
    sliderRise.value = '0';
    inputCheckinPrice.value = '';

    if (exampleNotice) exampleNotice.classList.add('hidden');
    if (feedbackCheckin) feedbackCheckin.classList.add('hidden');

    clearFieldError(inputLitres, errorLitres);
    clearFieldError(inputHoursRun, errorHoursRun);
    clearFieldError(inputDays, errorDays);
    clearFieldError(inputWorkHours, errorWorkHours);
    clearFieldError(inputPrice, errorPrice);
    clearFieldError(inputCheckinPrice, errorCheckin);

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

  // Check-In & History Event Listeners
  formCheckin.addEventListener('submit', handleCheckinSubmit);

  if (btnStartCheckin) {
    btnStartCheckin.addEventListener('click', () => {
      inputCheckinPrice.focus();
      inputCheckinPrice.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }

  btnToggleTable.addEventListener('click', toggleHistoryTable);

  // Data Safety Event Listeners
  btnDownloadBackup.addEventListener('click', downloadBackup);
  inputRestoreFile.addEventListener('change', handleRestoreFile);
  btnReminderIcs.addEventListener('click', downloadCalendarReminder);
  btnClearAllData.addEventListener('click', openClearModal);
  btnCancelClear.addEventListener('click', closeClearModal);
  btnConfirmClear.addEventListener('click', performClearAllData);

  const btnGetStarted = document.getElementById('get-started-btn');
  if (btnGetStarted) {
    btnGetStarted.addEventListener('click', (e) => {
      e.preventDefault();
      resultsView.classList.add('hidden');
      flowContainer.classList.remove('hidden');
      goToStep(1);
      flowContainer.scrollIntoView({ behavior: 'smooth' });
    });
  }

  if (btnThemeToggle) {
    btnThemeToggle.addEventListener('click', () => {
      const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
      applyTheme(isDark ? 'light' : 'dark');
    });
  }

  // Initialize theme (default: light)
  initTheme();

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
