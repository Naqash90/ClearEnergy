'use strict';

/* CLEARENERGY – WHAT THE WEBSITE DOES
   1. Changing pages
   2. Calculator
   3. Phone menu */

/* ===== 1. CHANGING PAGES (menu, buttons, arrow keys) ===== */

const SLIDE_COUNT = 5;
const pageDeck = document.querySelector('#main-content');
const pageTrack = document.querySelector('#page-track');
const deckPanels = pageTrack.querySelectorAll('.deck-panel');
const navigation = document.querySelector('#primary-navigation');
const navLinks = navigation.querySelectorAll('[data-slide]');
const slideButtons = pageDeck.querySelectorAll('[data-go-slide]');
let currentSlide = 0;

// Open page number: 0 Home, 1 Tips, 2 Renewable, 3 Calculator, 4 About
function showSlide(index) {
  currentSlide = (index + SLIDE_COUNT) % SLIDE_COUNT;
  pageTrack.setAttribute('style', `transform: translateX(-${currentSlide * 20}%)`);

  deckPanels.forEach((panel, panelIndex) => {
    panel.setAttribute('aria-hidden', String(panelIndex !== currentSlide));
  });

  navLinks.forEach((link) => {
    const isActive = Number(link.getAttribute('data-slide')) === currentSlide;
    link.classList.toggle('is-active', isActive);
    if (isActive) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  });
}

navLinks.forEach((link) => {
  link.addEventListener('click', (event) => {
    event.preventDefault();
    showSlide(Number(link.getAttribute('data-slide')));
  });
});

slideButtons.forEach((button) => {
  button.addEventListener('click', () => showSlide(Number(button.getAttribute('data-go-slide'))));
});

pageDeck.addEventListener('keydown', (event) => {
  if (event.key === 'ArrowLeft') showSlide(currentSlide - 1);
  if (event.key === 'ArrowRight') showSlide(currentSlide + 1);
});

/* ===== 2. CALCULATOR ===== */

// Start values (also used by Reset) – change here = change the starting example
const defaults = { power: 100, hours: 4, days: 30, price: 25, compareHours: 2, appliance: '100' };

// Sliders + number boxes, with min and max
const controls = {
  power: { range: document.querySelector('#power-range'), number: document.querySelector('#power-number'), min: 1, max: 5000 },
  hours: { range: document.querySelector('#hours-range'), number: document.querySelector('#hours-number'), min: 0, max: 24 },
  days: { range: document.querySelector('#days-range'), number: document.querySelector('#days-number'), min: 0, max: 31 },
  price: { range: document.querySelector('#price-range'), number: document.querySelector('#price-number'), min: 1, max: 100 }
};

const deviceRadios = document.querySelectorAll('input[name="appliance"]');
const compareRange = document.querySelector('#compare-hours-range');
const compareNumber = document.querySelector('#compare-hours-number');
const compareMessage = document.querySelector('#compare-message');
const currentCostBar = document.querySelector('#current-cost-bar');
const newCostBar = document.querySelector('#new-cost-bar');
const yearlySaving = document.querySelector('#yearly-saving');

// Keep a typed number between min and max
function clamp(value, minimum, maximum, fallback) {
  if (value === '') return fallback;
  const parsedValue = Number(value);
  if (!Number.isFinite(parsedValue)) return fallback;
  return Math.min(Math.max(parsedValue, minimum), maximum);
}

function syncControl(control, value) {
  control.range.value = clamp(value, control.min, control.max, Number(control.range.value));
  // Slider and number box show the same value
  if (control.number.value === '' || Number(control.number.value) !== Number(control.range.value)) {
    control.number.value = control.range.value;
  }
}

// Number and money format (12.00 and £3.00)
function formatNumber(value, maximumDecimals = 2) {
  return value.toLocaleString('en-GB', { minimumFractionDigits: Math.min(2, maximumDecimals), maximumFractionDigits: maximumDecimals });
}

function formatMoney(value) {
  return value.toLocaleString('en-GB', { style: 'currency', currency: 'GBP', minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// Colour the slider up to the circle
function setRangeFill(input) {
  const minimum = Number(input.min);
  const maximum = Number(input.max);
  const percentage = maximum === minimum ? 0 : ((Number(input.value) - minimum) / (maximum - minimum)) * 100;
  input.setAttribute('style', `--fill: ${Math.max(0, Math.min(100, percentage))}%`);
}

// Mark the chosen device tile
function selectDevice(value) {
  deviceRadios.forEach((radio) => { radio.checked = radio.value === value; });
}

// MAIN CALCULATION – cost per day, month and year
function updateResults() {
  const power = Number(controls.power.range.value);
  const hours = Number(controls.hours.range.value);
  const days = Number(controls.days.range.value);
  const price = Number(controls.price.range.value);

  const priceInPounds = price / 100;
  const dailyEnergy = (power / 1000) * hours;
  const monthlyEnergy = dailyEnergy * days;
  const monthlyCost = monthlyEnergy * priceInPounds;

  document.querySelector('#daily-energy').textContent = `${formatNumber(dailyEnergy)} kWh`;
  document.querySelector('#daily-cost').textContent = formatMoney(dailyEnergy * priceInPounds);
  document.querySelector('#monthly-energy').textContent = `${formatNumber(monthlyEnergy)} kWh`;
  document.querySelector('#monthly-cost').textContent = formatMoney(monthlyCost);
  document.querySelector('#yearly-cost').textContent = formatMoney(monthlyCost * 12);
  document.querySelector('#calculation-text').textContent = `(${formatNumber(power, 1)} W ÷ 1,000) × ${formatNumber(hours, 1)} hours × ${days} days × (${formatNumber(price, 1)} p/kWh ÷ 100) = ${formatMoney(monthlyCost)} per month.`;

  updateSaving(monthlyCost, power, days, priceInPounds, hours);
  Object.values(controls).forEach((control) => setRangeFill(control.range));
  setRangeFill(compareRange);
}

// SEE YOUR SAVING – cost with fewer hours
function updateSaving(currentMonthlyCost, power, days, priceInPounds, currentHours) {
  // New hours cannot be more than current hours
  compareRange.max = currentHours;
  compareNumber.max = currentHours;
  const safeHours = clamp(compareNumber.value, 0, currentHours, Number(compareRange.value));
  compareMessage.textContent = Number(compareNumber.value) > currentHours ? `Enter ${currentHours} hours or less.` : '';

  compareRange.value = safeHours;
  if (compareNumber.value === '' || Number(compareNumber.value) !== Number(compareRange.value)) {
    compareNumber.value = compareRange.value;
  }

  const reducedCost = (power / 1000) * Number(compareRange.value) * days * priceInPounds;
  const difference = Math.max(0, currentMonthlyCost - reducedCost);

  document.querySelector('#current-monthly-cost').textContent = formatMoney(currentMonthlyCost);
  document.querySelector('#reduced-monthly-cost').textContent = formatMoney(reducedCost);
  document.querySelector('#cost-difference').textContent = formatMoney(difference);
  yearlySaving.textContent = formatMoney(difference * 12);

  const newWidth = currentMonthlyCost > 0 ? (reducedCost / currentMonthlyCost) * 100 : 0;
  currentCostBar.setAttribute('style', `width: ${currentMonthlyCost > 0 ? 100 : 0}%`);
  newCostBar.setAttribute('style', `width: ${Math.max(0, Math.min(100, newWidth))}%`);
}

// Move a slider or type a number = new result
Object.values(controls).forEach((control) => {
  control.range.addEventListener('input', () => {
    control.number.value = control.range.value;
    updateResults();
  });

  // Empty box while typing = wait
  control.number.addEventListener('input', () => {
    if (control.number.value === '') return;
    syncControl(control, control.number.value);
    updateResults();
  });

  control.number.addEventListener('change', () => {
    syncControl(control, control.number.value);
    updateResults();
  });
});

// Click a device tile = its watts go into Power
deviceRadios.forEach((radio) => {
  radio.addEventListener('change', () => {
    if (!radio.checked) return;
    if (radio.value !== 'custom') syncControl(controls.power, radio.value);
    updateResults();
  });
});

// Change Power by hand = "Other" tile
controls.power.number.addEventListener('input', () => selectDevice('custom'));
controls.power.range.addEventListener('input', () => selectDevice('custom'));

// Saving slider + number box
compareRange.addEventListener('input', () => {
  compareNumber.value = compareRange.value;
  compareMessage.textContent = '';
  updateResults();
});

compareNumber.addEventListener('input', () => {
  if (compareNumber.value === '') return;
  updateResults();
});

compareNumber.addEventListener('change', updateResults);

// Reset button = back to start values
document.querySelector('#reset-calculator').addEventListener('click', () => {
  selectDevice(defaults.appliance);
  Object.entries(controls).forEach(([name, control]) => syncControl(control, defaults[name]));
  compareNumber.value = defaults.compareHours;
  compareMessage.textContent = '';
  updateResults();
});

/* ===== 3. PHONE MENU (☰ button) ===== */

const menuButton = document.querySelector('.menu-toggle');

// Open or close the menu
function setMenuOpen(isOpen) {
  menuButton.setAttribute('aria-expanded', String(isOpen));
  menuButton.querySelector('.sr-only').textContent = isOpen ? 'Close navigation menu' : 'Open navigation menu';
  navigation.classList.toggle('is-open', isOpen);
}

menuButton.addEventListener('click', () => setMenuOpen(menuButton.getAttribute('aria-expanded') !== 'true'));
navLinks.forEach((link) => link.addEventListener('click', () => setMenuOpen(false)));

// Esc key = close the menu
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && navigation.classList.contains('is-open')) {
    setMenuOpen(false);
    menuButton.focus();
  }
});

/* ===== START: show Home and the first result ===== */

showSlide(0);
updateResults();
