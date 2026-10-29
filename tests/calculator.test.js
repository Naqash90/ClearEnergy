// Run with: node --test tests/calculator.test.js
// These tests execute the website script and its event handlers without packages.
// The small DOM stand-in includes range clamping/step rounding; visual checks
// and full browser behaviour still need to be checked in a browser.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const script = fs.readFileSync(path.join(root, 'js/script.js'), 'utf8');

class Element {
  constructor(attributes = {}) {
    this.attributes = attributes;
    this.type = attributes.type;
    this.min = attributes.min || '0';
    this._max = attributes.max || '100';
    this.step = attributes.step || '1';
    this.listeners = {};
    this.textContent = '';
    this.value = attributes.value || '';
    const classes = new Set();
    this.classList = {
      contains: (name) => classes.has(name),
      remove: (name) => classes.delete(name),
      toggle: (name, enabled) => enabled ? classes.add(name) : classes.delete(name)
    };
  }

  get max() { return this._max; }
  set max(value) {
    this._max = String(value);
    if (this.type === 'range') this.value = this.value;
  }

  get value() { return this._value; }
  set value(value) {
    if (this.type === 'range') {
      const minimum = Number(this.min);
      const maximum = Number(this.max);
      const step = Number(this.step);
      let number = Number(value);
      if (!Number.isFinite(number)) number = (minimum + maximum) / 2;
      number = Math.min(Math.max(number, minimum), maximum);
      const lastStep = Math.floor((maximum - minimum) / step);
      const roundedStep = Math.min(Math.round((number - minimum) / step), lastStep);
      this._value = String(Number((minimum + roundedStep * step).toFixed(10)));
    } else {
      this._value = String(value);
    }
  }

  addEventListener(event, handler) {
    (this.listeners[event] ||= []).push(handler);
  }
  dispatch(event, details = {}) {
    for (const handler of this.listeners[event] || []) handler(details);
  }
  getAttribute(name) { return this.attributes[name]; }
  setAttribute(name, value) { this.attributes[name] = value; }
  querySelector() { return this.label ||= new Element(); }
  querySelectorAll() { return []; }
  focus() {}
}

function loadCalculator() {
  const elements = new Map();
  for (const match of html.matchAll(/<[^>]+\bid="([^"]+)"[^>]*>/g)) {
    const attributes = {};
    for (const attribute of match[0].matchAll(/([\w-]+)="([^"]*)"/g)) {
      attributes[attribute[1]] = attribute[2];
    }
    elements.set(`#${match[1]}`, new Element(attributes));
  }
  elements.set('.menu-toggle', new Element({ 'aria-expanded': 'false' }));
  const document = {
    querySelector(selector) {
      assert.ok(elements.has(selector), `Missing element: ${selector}`);
      return elements.get(selector);
    },
    querySelectorAll(selector) {
      assert.equal(selector, 'input[name="appliance"]');
      return [...elements.values()].filter((element) => element.attributes.name === 'appliance');
    },
    addEventListener() {}
  };
  vm.runInNewContext(script, { document }, { filename: 'js/script.js' });
  return {
    get: (id) => elements.get(`#${id}`),
    enter(id, value, event = 'input') {
      const element = elements.get(`#${id}`);
      element.value = value;
      element.dispatch(event);
    },
    reset() { elements.get('#reset-calculator').dispatch('click'); },
    chooseDevice(id) {
      const radio = elements.get(`#${id}`);
      for (const element of elements.values()) {
        if (element.attributes.name === 'appliance') element.checked = element === radio;
      }
      radio.dispatch('change');
    }
  };
}

test('the displayed example uses watts, hours, days and pence correctly', () => {
  const app = loadCalculator();
  app.enter('power-number', '500');
  assert.equal(app.get('daily-energy').textContent, '2.00 kWh');
  assert.equal(app.get('daily-cost').textContent, '£0.50');
  assert.equal(app.get('monthly-energy').textContent, '60.00 kWh');
  assert.equal(app.get('monthly-cost').textContent, '£15.00');
  assert.equal(app.get('yearly-cost').textContent, '£180.00');
  assert.equal(app.get('cost-difference').textContent, '£7.50');
  assert.match(app.get('calculation-text').textContent, /25\.0 p\/kWh ÷ 100/);
});

test('number fields and sliders agree after step rounding and limits', () => {
  const app = loadCalculator();
  for (const [name, typed, expected] of [
    ['power', '100.7', '101'], ['hours', '5.3', '5.5'],
    ['days', '30.6', '31'], ['price', '25.26', '25.3'],
    ['power', '99999', '5000'], ['hours', '-5', '0'],
    ['days', '99', '31'], ['price', '-10', '1']
  ]) {
    app.enter(`${name}-number`, typed);
    assert.equal(app.get(`${name}-number`).value, expected);
    assert.equal(app.get(`${name}-range`).value, expected);
  }
  assert.equal(app.get('monthly-cost').textContent, '£0.00');
});

test('an empty field preserves its last valid value until editing is finished', () => {
  const app = loadCalculator();
  app.enter('power-number', '500');
  app.enter('power-number', '');
  app.enter('days-range', '10');
  assert.equal(app.get('monthly-cost').textContent, '£5.00');
  app.get('power-number').dispatch('change');
  assert.equal(app.get('power-number').value, '500');
  app.enter('power-number', 'Infinity');
  assert.equal(app.get('power-number').value, '500');
  assert.equal(app.get('monthly-cost').textContent, '£5.00');
});

test('comparison is step-aligned and never exceeds current daily hours', () => {
  const app = loadCalculator();
  app.enter('compare-hours-number', '1.3');
  assert.equal(app.get('compare-hours-number').value, '1.5');
  assert.equal(app.get('compare-hours-range').value, '1.5');
  app.enter('compare-hours-number', '20');
  assert.equal(app.get('compare-hours-number').value, '4');
  assert.equal(app.get('cost-difference').textContent, '£0.00');
  assert.equal(app.get('compare-message').textContent, 'Enter 4 hours or less.');
  app.enter('hours-number', '1');
  assert.equal(app.get('compare-hours-range').max, '1');
  assert.equal(app.get('compare-hours-number').value, '1');
  app.enter('compare-hours-number', '-1');
  assert.equal(app.get('compare-hours-number').value, '0');
  assert.equal(app.get('reduced-monthly-cost').textContent, '£0.00');
});

test('reset restores the comparison after the available hours drop to zero', () => {
  const app = loadCalculator();
  app.enter('hours-range', '0');
  assert.equal(app.get('compare-hours-range').max, '0');
  assert.equal(app.get('compare-hours-number').value, '0');
  app.reset();
  assert.equal(app.get('hours-number').value, '4');
  assert.equal(app.get('compare-hours-range').max, '4');
  assert.equal(app.get('compare-hours-range').value, '2');
  assert.equal(app.get('compare-hours-number').value, '2');
  assert.equal(app.get('monthly-cost').textContent, '£3.00');
  assert.equal(app.get('cost-difference').textContent, '£1.50');
  assert.equal(app.get('yearly-saving').textContent, '£18.00');
  assert.equal(app.get('device-tv').checked, true);
});

test('appliance presets, range inputs and zero/maximum usage update real outputs', () => {
  const app = loadCalculator();
  app.chooseDevice('device-laptop');
  assert.equal(app.get('power-number').value, '65');
  assert.equal(app.get('power-range').value, '65');
  app.enter('power-range', '5000');
  assert.equal(app.get('device-custom').checked, true);
  assert.equal(app.get('device-laptop').checked, false);
  app.enter('hours-range', '24');
  app.enter('days-range', '31');
  app.enter('price-range', '100');
  assert.equal(app.get('monthly-cost').textContent, '£3,720.00');
  assert.equal(app.get('yearly-cost').textContent, '£44,640.00');
  app.enter('days-range', '0');
  assert.equal(app.get('monthly-cost').textContent, '£0.00');
  assert.equal(app.get('yearly-cost').textContent, '£0.00');
  assert.equal(app.get('cost-difference').textContent, '£0.00');
});
