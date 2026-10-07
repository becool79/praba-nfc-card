const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const { runInNewContext } = require('node:vm');
const source = readFileSync(join(__dirname, 'profile.js'), 'utf8');
const canonical = 'https://becool79.github.io/praba-nfc-card/';

function setup(options = {}) {
  const nodes = new Map();
  const documentEvents = {};
  const scripts = [];
  function node(selector) {
    if (!nodes.has(selector)) nodes.set(selector, {
      href: selector.includes('canonical') ? canonical : 'profile-qr.png',
      hidden: true, textContent: '', handlers: {}, open: false,
      addEventListener(type, handler) { this.handlers[type] = handler; },
      showModal() { this.open = true; },
      close() { this.open = false; this.handlers.close?.(); },
      focus() { this.focused = true; }, select() { this.selected = true; },
    });
    return nodes.get(selector);
  }
  const document = {
    querySelector: node,
    addEventListener(type, handler) { documentEvents[type] = handler; },
    createElement() { return {}; }, head: { append(script) { scripts.push(script); } },
  };
  const window = { PROFILE_ANALYTICS: { endpoint: options.endpoint ?? '' }, location: { assign(url) { window.assigned = url; } } };
  const navigator = { ...options.navigator };
  if (options.noDialog) node('#share-dialog').showModal = undefined;
  runInNewContext(source, { document, window, navigator, location: { hostname: options.hostname ?? 'becool79.github.io' } });
  return { node, window, navigator, scripts, documentEvents };
}
// Test-only endpoint. The VM never performs network requests.
const endpoint = 'https://test-fixture.goatcounter.com/count';

test('disabled analytics, invalid endpoints and local previews load no remote script', () => {
  for (const options of [{}, {endpoint:'https://other.example/count'}, {endpoint,hostname:'localhost'}, {endpoint,hostname:'127.0.0.1'}]) {
    const app = setup(options);
    assert.equal(app.scripts.length, 0);
    assert.equal(app.node('#share-profile').hidden, false);
  }
});
test('privacy preferences prevent all analytics script loading', () => {
  for (const navigator of [{doNotTrack:'1'}, {globalPrivacyControl:true}]) {
    assert.equal(setup({endpoint,navigator}).scripts.length, 0);
  }
});
test('configured analytics sends fixed page/event data and queues early clicks', () => {
  const app = setup({endpoint});
  const events = [];
  const click = (action) => app.documentEvents.click({target:{closest:()=>({dataset:{action}})}});
  click('call');
  assert.equal(app.scripts.length, 1);
  assert.equal(app.scripts[0].referrerPolicy, 'no-referrer');
  app.window.goatcounter.count = event => events.push(event);
  app.scripts[0].onload();
  const actions = ['save-contact','whatsapp','office-email','personal-email','company-website','view-map','share-profile','show-qr','copy-link','download-qr'];
  actions.forEach(click);
  click('mailto:private@example.com');
  assert.equal(events.length, 12);
  assert.equal(events[0].path, '/praba-nfc-card/');
  assert.equal(events[1].path, 'action-call');
  assert.ok(events.every(e => e.referrer === ''));
  assert.ok(events.slice(1).every(e => e.event && e.no_session));
  assert.ok(!JSON.stringify(events).includes('@'));
  app.navigator.globalPrivacyControl = true;
  click('call');
  assert.equal(events.length, 12);
});
test('analytics failure cannot prevent action handlers', async () => {
  const app = setup({endpoint});
  app.scripts[0].onerror();
  app.window.goatcounter.count = () => { throw new Error('blocked'); };
  assert.doesNotThrow(() => app.documentEvents.click({target:{closest:()=>({dataset:{action:'call'}})}}));
  await app.node('#share-profile').handlers.click();
  assert.equal(app.node('#share-dialog').open, true);
});
test('native share receives only the canonical URL; cancel stays silent', async () => {
  let payload;
  const app = setup({navigator:{share:async data=>{payload=data;}}});
  await app.node('#share-profile').handlers.click();
  assert.equal(payload.url, canonical);
  assert.equal(app.node('#share-dialog').open, false);
  assert.equal(app.node('#share-status').textContent, 'Profile shared.');
  const cancelled = setup({navigator:{share:async()=>{throw {name:'AbortError'};}}});
  await cancelled.node('#share-profile').handlers.click();
  assert.equal(cancelled.node('#share-dialog').open, false);
});
test('unavailable or failed native share opens dialog and restores focus', async () => {
  for (const navigator of [{}, {share:async()=>{throw new Error('unsupported');}}]) {
    const app = setup({navigator});
    await app.node('#share-profile').handlers.click();
    assert.equal(app.node('#share-dialog').open, true);
    app.node('.close').handlers.click();
    assert.equal(app.node('#share-profile').focused, true);
  }
});
test('clipboard success and denied/unavailable clipboard have usable outcomes', async () => {
  let copied;
  const app = setup({navigator:{clipboard:{writeText:async text=>{copied=text;}}}});
  await app.node('#copy-link').handlers.click();
  assert.equal(copied, canonical);
  assert.equal(app.node('#copy-status').textContent, 'Profile link copied.');
  const unavailable = setup();
  await unavailable.node('#copy-link').handlers.click();
  assert.equal(unavailable.node('#profile-url').selected, true);
  assert.match(unavailable.node('#copy-status').textContent, /copy the profile link/);
});
test('QR opens modal; unsupported dialog keeps direct image link working', () => {
  const app = setup(); let prevented = false;
  app.node('#show-qr').handlers.click({preventDefault(){prevented=true;}});
  assert.equal(prevented, true);
  assert.equal(app.node('#share-dialog').open, true);
  const fallback = setup({noDialog:true});
  fallback.node('#show-qr').handlers.click({preventDefault(){throw Error('must keep link');}});
});

