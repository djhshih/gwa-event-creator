const fs = require('fs');
const vm = require('vm');
const path = require('path');

// Load parse.js into a VM context with mocked Utilities and format strings
const parsePath = path.join(__dirname, '..', 'parse.js');
const code = fs.readFileSync(parsePath, 'utf8');

const context = {
  console: console,
  DATE_FORMAT: 'yyyy-MM-dd',
  TIME_FORMAT: 'h:mm a',
  Utilities: {
    parseDate: function(s, tz, format) {
      if (!s) throw new Error('Empty');
      s = String(s).trim();
      // Time formats
      if (/h+/.test(format) && /a/i.test(format)) {
        const m = s.match(/(\d{1,2}):(\d{2})\s*(am|pm)/i);
        if (!m) throw new Error('Bad time');
        let h = parseInt(m[1], 10);
        const min = parseInt(m[2], 10);
        if (min < 0 || min > 59) throw new Error('Bad time');
        const ampm = m[3].toLowerCase();
        if (h < 1 || h > 12) throw new Error('Bad time');
        if (ampm === 'pm' && h < 12) h += 12;
        if (ampm === 'am' && h === 12) h = 0;
        return new Date(Date.UTC(1970,0,1,h,min,0));
      }
      if (/H{2}:mm/.test(format) || /HH:mm/.test(format)) {
        const m = s.match(/^(\d{1,2}):(\d{2})$/);
        if (!m) throw new Error('Bad time');
        const h = parseInt(m[1], 10);
        const min = parseInt(m[2], 10);
        return new Date(Date.UTC(1970,0,1,h,min,0));
      }
      // Date formats - try ISO yyyy-mm-dd first
      if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(s)) {
        const parts = s.split('-').map(x => parseInt(x,10));
        return new Date(Date.UTC(parts[0], parts[1]-1, parts[2]));
      }
      // Fallback: let Date parse it (append UTC to avoid local tz shifts)
      const parsed = Date.parse(s + ' UTC');
      if (isNaN(parsed)) throw new Error('Bad date');
      return new Date(parsed);
    },
    formatDate: function(dateObj, tz, format) {
      if (!(dateObj instanceof Date)) return String(dateObj);
      if (format === 'h:mm a') {
        const h = dateObj.getUTCHours();
        const m = dateObj.getUTCMinutes();
        const ampm = h >= 12 ? 'PM' : 'AM';
        let h12 = h % 12;
        if (h12 === 0) h12 = 12;
        const mm = m.toString().padStart(2, '0');
        return `${h12}:${mm} ${ampm}`;
      }
      if (format === 'HH:mm') {
        const h = dateObj.getUTCHours().toString().padStart(2,'0');
        const m = dateObj.getUTCMinutes().toString().padStart(2,'0');
        return `${h}:${m}`;
      }
      if (format === 'yyyy-MM-dd') {
        const y = dateObj.getUTCFullYear();
        const mo = (dateObj.getUTCMonth()+1).toString().padStart(2,'0');
        const d = dateObj.getUTCDate().toString().padStart(2,'0');
        return `${y}-${mo}-${d}`;
      }
      return dateObj.toUTCString();
    }
  }
};

vm.createContext(context);
vm.runInContext(code, context);

function assertEquals(actual, expected, msg) {
  if (actual !== expected) {
    throw new Error(`${msg} - expected: ${expected}, actual: ${actual}`);
  }
}

function assertContains(haystack, needle, msg) {
  if (!haystack || haystack.indexOf(needle) === -1) {
    throw new Error(`${msg} - expected to contain: ${needle}, actual: ${haystack}`);
  }
}

let tests = 0;
let passed = 0;

function runTest(name, fn) {
  tests++;
  try {
    fn();
    console.log(`PASS: ${name}`);
    passed++;
  } catch (e) {
    console.error(`FAIL: ${name}: ${e.message}`);
  }
}

// Test 1: simple ISO date and short time range
runTest('ISO date and short time range', () => {
  const body = `Title: X\nDate: 2026-03-20\nTime: 4-5pm\n`;
  const res = context.extractDateTime(body);
  assertEquals(res.date, '2026-03-20', 'date');
  assertEquals(res.times.start, '4:00 PM', 'start time');
  assertEquals(res.times.end, '5:00 PM', 'end time');
  if (res.error && res.error.length) throw new Error('unexpected error: '+res.error);
});

// Test 2: verbose date and time with 'to'
runTest('Verbose date and time with to', () => {
  const body = `Date: March 21 2026\nTime: 9:30am to 11:00 am\n`;
  const res = context.extractDateTime(body);
  assertEquals(res.date, '2026-03-21', 'date');
  assertEquals(res.times.start, '9:30 AM', 'start time');
  assertEquals(res.times.end, '11:00 AM', 'end time');
});

// Test 3: invalid date
runTest('Invalid date reports error', () => {
  const body = `Date: March 32 2026\nTime: 4pm-5pm\n`;
  const res = context.extractDateTime(body);
  assertContains(res.error, 'Unrecognized date format', 'date error');
  // date should be returned as original normalized string (not formatted)
  if (!res.date.includes('March')) throw new Error('date normalized unexpectedly: '+res.date);
});

// Test 4: invalid time
runTest('Invalid time reports error', () => {
  const body = `Date: 2026-03-20\nTime: 25pm-26pm\n`;
  const res = context.extractDateTime(body);
  assertContains(res.error, 'Unrecognized time format', 'time error');
});

console.log(`\nTests: ${tests}, Passed: ${passed}, Failed: ${tests - passed}`);
if (passed !== tests) process.exit(1);
