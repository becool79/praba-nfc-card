(() => {
  'use strict';
  const profileURL = document.querySelector('link[rel="canonical"]').href;
  const dialog = document.querySelector('#share-dialog');
  const share = document.querySelector('#share-profile');
  const qr = document.querySelector('#show-qr');
  const link = document.querySelector('#profile-url');
  const status = document.querySelector('#copy-status');
  let opener;
  const openDialog = (source) => {
    opener = source;
    status.textContent = '';
    if (typeof dialog.showModal === 'function') dialog.showModal();
    else window.location.assign(qr.href);
  };
  share.hidden = false;
  share.addEventListener('click', async () => {
    if (typeof navigator.share === 'function') {
      try {
        await navigator.share({ title: 'Prabagaran | Metrod Malaysia', text: 'Connect with Praba, Security Manager at Metrod Malaysia.', url: profileURL });
        document.querySelector('#share-status').textContent = 'Profile shared.';
        return;
      } catch (error) {
        if (error.name === 'AbortError') return;
      }
    }
    openDialog(share);
  });
  qr.addEventListener('click', (event) => {
    if (typeof dialog.showModal !== 'function') return;
    event.preventDefault();
    openDialog(qr);
  });
  document.querySelector('.close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => opener?.focus());
  dialog.addEventListener('click', (event) => {
    if (event.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
  });
  document.querySelector('#copy-link').addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(profileURL);
      status.textContent = 'Profile link copied.';
    } catch {
      link.focus();
      link.select();
      status.textContent = 'Select and copy the profile link above.';
    }
  });

  // Only fixed action names are sent: never link destinations or contact details.
  const allowed = new Set(['save-contact', 'call', 'whatsapp', 'office-email', 'personal-email', 'company-website', 'view-map', 'share-profile', 'show-qr', 'copy-link', 'download-qr']);
  const endpoint = window.PROFILE_ANALYTICS?.endpoint || '';
  const configured = /^https:\/\/[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.goatcounter\.com\/count$/.test(endpoint);
  if (configured) document.querySelector('#analytics-notice').textContent = 'Visit and action counts are enabled through GoatCounter. No analytics cookies, contact details, query strings or referrers are sent by this page. Do Not Track and Global Privacy Control are respected. The analytics provider receives normal connection data, including an IP address; GitHub Pages and linked services have their own privacy practices.';
  const optedOut = () => navigator.doNotTrack === '1' || window.doNotTrack === '1' || navigator.globalPrivacyControl === true;
  if (!configured || optedOut() || location.hostname !== 'becool79.github.io') return;
  window.goatcounter = { endpoint, no_onload: true, no_events: true, path: '/praba-nfc-card/', title: 'Business card', referrer: '' };
  const queue = [];
  const send = (event) => {
    if (optedOut()) return;
    try {
      if (typeof window.goatcounter.count === 'function') window.goatcounter.count(event);
      else if (queue.length < 20) queue.push(event);
    } catch { /* Analytics must never block a contact action. */ }
  };
  document.addEventListener('click', (event) => {
    const action = event.target.closest('[data-action]')?.dataset.action;
    if (allowed.has(action)) send({ path: `action-${action}`, title: action, event: true, no_session: true, referrer: '' });
  });
  const script = document.createElement('script');
  script.src = 'https://gc.zgo.at/count.js';
  script.async = true;
  script.referrerPolicy = 'no-referrer';
  script.onload = () => {
    send({ path: '/praba-nfc-card/', title: 'Business card', referrer: '' });
    for (const event of queue.splice(0)) send(event);
  };
  script.onerror = () => { queue.length = 0; };
  document.head.append(script);
})();
