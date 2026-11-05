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
const navSide = document.querySelector('#nav-side');
const navLinks = navigation.querySelectorAll('[data-slide]');
const slideButtons = pageDeck.querySelectorAll('[data-go-slide]');
const homeLogo = document.querySelector('#home-logo');
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

homeLogo.addEventListener('click', (event) => {
  event.preventDefault();
  showSlide(0);
  if (typeof deckPanels[0].scrollTo === 'function') deckPanels[0].scrollTo({ top: 0, behavior: 'smooth' });
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
const multiDeviceToggle = document.querySelector('#multi-device-toggle');
const deviceTiles = document.querySelector('#calc-devices');
const deviceNames = { '10': 'LED light', '100': 'TV', '65': 'Laptop', '2000': 'Heater', custom: 'Other device' };
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

function selectedDevices() {
  return [...deviceRadios].filter((device) => device.checked);
}

function setMultiDeviceMode(enabled) {
  multiDeviceToggle.checked = enabled;
  deviceTiles.classList.toggle('is-multi', enabled);
  controls.power.range.disabled = enabled;
  controls.power.number.disabled = enabled;
  if (enabled) {
    const custom = [...deviceRadios].find((device) => device.value === 'custom');
    custom.checked = false;
    if (!selectedDevices().length) selectDevice(defaults.appliance);
    const totalPower = selectedDevices().reduce((total, device) => total + Number(device.value), 0);
    syncControl(controls.power, totalPower);
  }
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
    if (multiDeviceToggle.checked) {
      if (radio.value === 'custom') radio.checked = false;
      if (!selectedDevices().length) radio.checked = true;
      const totalPower = selectedDevices().reduce((total, device) => total + Number(device.value), 0);
      syncControl(controls.power, totalPower);
    } else {
      if (!radio.checked) radio.checked = true;
      deviceRadios.forEach((device) => { if (device !== radio) device.checked = false; });
      if (radio.value !== 'custom') syncControl(controls.power, radio.value);
    }
    updateResults();
  });
});

multiDeviceToggle.addEventListener('change', () => {
  setMultiDeviceMode(multiDeviceToggle.checked);
  if (!multiDeviceToggle.checked) {
    const first = selectedDevices()[0] || [...deviceRadios].find((device) => device.value === defaults.appliance);
    selectDevice(first.value);
    syncControl(controls.power, first.value);
  }
  updateResults();
});

// Change Power by hand = "Other" tile
controls.power.number.addEventListener('input', () => { setMultiDeviceMode(false); selectDevice('custom'); });
controls.power.range.addEventListener('input', () => { setMultiDeviceMode(false); selectDevice('custom'); });

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
  setMultiDeviceMode(false);
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
  navSide.classList.toggle('is-open', isOpen);
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

/* ===== 4. ACCOUNT, DATABASE AND SAVED RESULTS ===== */

if (typeof fetch === 'function') {
  const accountDialog = document.querySelector('#account-dialog');
  const historyDialog = document.querySelector('#history-dialog');
  const accountStatus = document.querySelector('#account-status');
  const accountMessage = document.querySelector('#account-message');
  const dialogMessage = document.querySelector('#dialog-message');
  const loginForm = document.querySelector('#login-form');
  const registerForm = document.querySelector('#register-form');
  const loginOpen = document.querySelector('#login-open');
  const registerOpen = document.querySelector('#register-open');
  const guestMenu = document.querySelector('#guest-menu');
  const userMenu = document.querySelector('#user-menu');
  const profileOpen = document.querySelector('#profile-open');
  const saveResult = document.querySelector('#save-result');
  const myRecords = document.querySelector('#my-records');
  const adminRecords = document.querySelector('#admin-records');
  const accountLogout = document.querySelector('#account-logout');
  const emailResult = document.querySelector('#email-result');
  const emailDialog = document.querySelector('#email-dialog');
  const emailForm = document.querySelector('#email-form');
  const emailDone = document.querySelector('#email-done');
  let signedInUser = null;

  async function api(url, options = {}) {
    const response = await fetch(url, {
      ...options,
      headers: { 'Content-Type': 'application/json', ...(options.headers || {}) }
    });
    const data = await response.json();
    const apiError = typeof data.detail === 'string' ? data.detail : data.detail?.[0]?.msg;
    if (!response.ok) throw new Error(data.error || apiError || 'Something went wrong.');
    return data;
  }

  function updateAccount(user) {
    signedInUser = user;
    const isSignedIn = Boolean(user);
    accountStatus.textContent = isSignedIn ? `${user.name} · ${user.role === 'admin' ? 'Administrator' : 'User'}` : 'Sign in to save your results.';
    guestMenu.hidden = isSignedIn;
    userMenu.hidden = !isSignedIn;
    saveResult.hidden = !isSignedIn;
    emailResult.hidden = !isSignedIn;
    adminRecords.hidden = !isSignedIn || user.role !== 'admin';
    if (isSignedIn) {
      const initials = user.name.split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase();
      document.querySelector('#menu-avatar').textContent = initials;
      document.querySelector('#menu-user-name').textContent = user.name;
      document.querySelector('#profile-avatar').textContent = initials;
      document.querySelector('#profile-name').textContent = user.name;
      document.querySelector('#profile-email').textContent = `${user.email} · ${user.role === 'admin' ? 'Administrator' : 'User'}`;
    }
  }

  function showAccountMode(mode) {
    const showLogin = mode === 'login';
    loginForm.hidden = !showLogin;
    registerForm.hidden = showLogin;
    document.querySelector('#show-login').classList.toggle('is-active', showLogin);
    document.querySelector('#show-register').classList.toggle('is-active', !showLogin);
    dialogMessage.textContent = '';
  }

  function snapshot() {
    const power = Number(controls.power.range.value);
    const hours = Number(controls.hours.range.value);
    const days = Number(controls.days.range.value);
    const price = Number(controls.price.range.value);
    const monthlyCost = (power / 1000) * hours * days * (price / 100);
    const device = selectedDevices().map((item) => deviceNames[item.value]).join(', ') || 'Other device';
    return { device, power, hours, days, price, monthlyCost, yearlyCost: monthlyCost * 12 };
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
  }

  function renderHistory(calculations, adminView) {
    const list = document.querySelector('#history-list');
    document.querySelector('#history-title').textContent = adminView ? 'All saved calculations' : 'Your saved calculations';
    myRecords.classList.toggle('is-active', !adminView);
    adminRecords.classList.toggle('is-active', adminView);
    if (!calculations.length) {
      list.innerHTML = '<p class="history-empty">No saved calculations yet.</p>';
    } else {
      list.innerHTML = `<table class="history-table"><thead><tr>
        ${adminView ? '<th>User</th>' : ''}<th>Device</th><th>Power</th><th>Usage</th><th>Price</th><th>Monthly</th><th>Yearly</th><th>Saved</th>
        </tr></thead><tbody>${calculations.map((item) => `<tr>
          ${adminView ? `<td><strong>${escapeHtml(item.name)}</strong><br><small>${escapeHtml(item.email)}</small></td>` : ''}
          <td><strong>${escapeHtml(item.device)}</strong></td>
          <td>${formatNumber(item.power, 1)} W</td>
          <td>${formatNumber(item.hours, 1)} hrs/day<br><small>${item.days} days/month</small></td>
          <td>${formatNumber(item.price, 1)} p/kWh</td>
          <td><strong>${formatMoney(item.monthly_cost)}</strong></td>
          <td>${formatMoney(item.yearly_cost)}</td>
          <td>${new Date(`${item.created_at}Z`).toLocaleDateString('en-GB')}</td>
        </tr>`).join('')}</tbody></table>`;
    }
    if (!historyDialog.open) historyDialog.showModal();
  }

  loginOpen.addEventListener('click', () => { setMenuOpen(false); showAccountMode('login'); accountDialog.showModal(); });
  registerOpen.addEventListener('click', () => { setMenuOpen(false); showAccountMode('register'); accountDialog.showModal(); });
  document.querySelector('#account-close').addEventListener('click', () => accountDialog.close());
  document.querySelector('#history-close').addEventListener('click', () => historyDialog.close());
  document.querySelector('#email-close').addEventListener('click', () => emailDialog.close());
  emailDone.addEventListener('click', () => emailDialog.close());
  document.querySelector('#show-login').addEventListener('click', () => showAccountMode('login'));
  document.querySelector('#show-register').addEventListener('click', () => showAccountMode('register'));

  loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    dialogMessage.textContent = 'Signing in…';
    try {
      const data = await api('/api/login', { method: 'POST', body: JSON.stringify({ email: document.querySelector('#login-email').value, password: document.querySelector('#login-password').value }) });
      updateAccount(data.user); accountDialog.close(); accountMessage.textContent = 'Signed in successfully.';
    } catch (error) { dialogMessage.textContent = error.message; }
  });

  registerForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    dialogMessage.textContent = 'Creating account…';
    try {
      const data = await api('/api/register', { method: 'POST', body: JSON.stringify({ name: document.querySelector('#register-name').value, email: document.querySelector('#register-email').value, password: document.querySelector('#register-password').value }) });
      updateAccount(data.user); accountDialog.close(); accountMessage.textContent = data.message;
    } catch (error) { dialogMessage.textContent = error.message; }
  });

  saveResult.addEventListener('click', async () => {
    accountMessage.textContent = 'Saving…';
    try { const data = await api('/api/calculations', { method: 'POST', body: JSON.stringify(snapshot()) }); accountMessage.textContent = data.message; }
    catch (error) { accountMessage.textContent = error.message; }
  });

  profileOpen.addEventListener('click', async () => {
    setMenuOpen(false);
    try { renderHistory((await api('/api/calculations')).calculations, false); }
    catch (error) { accountMessage.textContent = error.message; }
  });

  myRecords.addEventListener('click', async () => {
    try { renderHistory((await api('/api/calculations')).calculations, false); }
    catch (error) { accountMessage.textContent = error.message; }
  });

  adminRecords.addEventListener('click', async () => {
    try { renderHistory((await api('/api/admin/calculations')).calculations, true); }
    catch (error) { accountMessage.textContent = error.message; }
  });

  emailResult.addEventListener('click', () => {
    const item = snapshot();
    document.querySelector('#email-recipient').value = '';
    document.querySelector('#email-preview').innerHTML = `<table><thead><tr><th>Device</th><th>Power</th><th>Usage</th><th>Price</th></tr></thead><tbody><tr><td>${escapeHtml(item.device)}</td><td>${item.power} W</td><td>${item.hours} hrs/day<br>${item.days} days/month</td><td>${item.price} p/kWh</td></tr></tbody></table><div class="email-preview-results"><div><span>Monthly cost</span><strong>${formatMoney(item.monthlyCost)}</strong></div><div><span>Yearly cost</span><strong>${formatMoney(item.yearlyCost)}</strong></div></div>`;
    const message = document.querySelector('#email-message');
    message.textContent = '';
    message.classList.remove('is-success');
    document.querySelector('#email-send').hidden = false;
    emailDone.hidden = true;
    emailDialog.showModal();
  });

  emailForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const message = document.querySelector('#email-message');
    const sendButton = document.querySelector('#email-send');
    message.classList.remove('is-success');
    message.textContent = 'Sending…';
    sendButton.disabled = true;
    try {
      const recipient = document.querySelector('#email-recipient').value.trim();
      const item = snapshot();
      const config = await api('/api/email-config');
      const dailyCost = item.monthlyCost / Math.max(item.days, 1);
      const usage = `${item.hours} hrs/day, ${item.days} days/month`;
      const deviceIcon = item.device.includes(',') ? '⚡' : ({
        'LED light': '💡',
        'TV': '📺',
        'Laptop': '💻',
        'Heater': '♨️'
      }[item.device] || '🔌');
      const monthlyEnergy = (item.power / 1000) * item.hours * item.days;
      const emailResponse = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service_id: config.serviceId,
          template_id: config.templateId,
          user_id: config.publicKey,
          template_params: {
            to_email: recipient,
            email: recipient,
            user_email: recipient,
            user_name: signedInUser?.name || 'ClearEnergy user',
            name: signedInUser?.name || 'ClearEnergy user',
            device: item.device,
            devices: item.device,
            device_icon: deviceIcon,
            total_power: `${item.power} W`,
            power: `${item.power} W`,
            usage,
            hours: item.hours,
            days: item.days,
            energy_price: `${item.price} p/kWh`,
            daily_cost: formatMoney(dailyCost),
            monthly_cost: formatMoney(item.monthlyCost),
            yearly_cost: formatMoney(item.yearlyCost),
            monthly_energy: `${formatNumber(monthlyEnergy, 2)} kWh`,
            calculation_date: new Date().toLocaleDateString('en-GB'),
            message: `Device: ${item.device}\nPower: ${item.power} W\nUsage: ${usage}\nEnergy price: ${item.price} p/kWh\nMonthly cost: ${formatMoney(item.monthlyCost)}\nYearly cost: ${formatMoney(item.yearlyCost)}`,
            order_id: 'ClearEnergy calculation',
            orders: [{ name: item.device, units: 1, price: formatMoney(item.monthlyCost) }],
            cost: { shipping: '£0.00', tax: '£0.00', total: formatMoney(item.monthlyCost) }
          }
        })
      });
      if (!emailResponse.ok) throw new Error((await emailResponse.text()).trim() || 'EmailJS could not send the message.');
      const data = await api('/api/email-result', { method: 'POST', body: JSON.stringify({ recipient, ...item }) });
      message.textContent = data.message;
      message.classList.add('is-success');
      sendButton.hidden = true;
      emailDone.hidden = false;
    } catch (error) { message.classList.remove('is-success'); message.textContent = error.message; }
    finally { sendButton.disabled = false; }
  });

  accountLogout.addEventListener('click', async () => {
    await api('/api/logout', { method: 'POST' });
    setMenuOpen(false); updateAccount(null); accountMessage.textContent = 'You are signed out.';
  });

  api('/api/me').then((data) => updateAccount(data.user)).catch(() => updateAccount(null));
}

/* ===== START: show Home and the first result ===== */

showSlide(0);
updateResults();
