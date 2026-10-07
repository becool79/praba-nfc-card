# Praba · Metrod digital business card

Published at **https://becool79.github.io/praba-nfc-card/**. The NFC card keeps using this URL; no rewrite is needed.

## Publishing

GitHub Pages is configured to **Deploy from a branch → main → / (root)**. Commit the static files to `main`; the existing `pages build and deployment` workflow publishes them. No build step, framework, CDN fonts or runtime dependencies are required. Do not rename this repository or change its Pages source casually: the physical NFC card depends on the URL.

The original `building.jpg`, `metrod_brand.jpg`, `profile.jpg`, and `contact.vcf` are preserved. Contact destinations remain in `index.html`. Keep `contact.vcf` in sync if details are intentionally changed later.

## Sharing

Share Profile uses the device's native share sheet when supported. Other browsers get a QR/link dialog with a clipboard button and a manual-copy fallback. Cancelling native sharing is silent. QR Code still links to the QR image when JavaScript is disabled. The QR image is local and contains only the published profile URL; it does not call an external QR service. The dialog supports Escape, close, focus return and native modal keyboard focus containment.

`profile-qr.png` was generated with Python qrcode 8.2, medium error correction, a four-module white border, and verified using zxing-cpp. It must be regenerated if the canonical URL ever changes. A future custom domain must preserve a working path from the original NFC URL and update the canonical/OG URL, readonly sharing field, QR image and analytics hostname guard together.

## Analytics — prepared, OFF by default

No visit/click analytics is collected while `analytics-config.js` has an empty endpoint. No analytics script is loaded and no analytics request is made in that state. GitHub Pages itself still handles ordinary hosting requests.

To activate:

1. The owner must create or use a real [GoatCounter](https://www.goatcounter.com/) account/site appropriate for their use and review its current terms, privacy and plan requirements.
2. Copy that site's public HTTPS counting endpoint into `analytics-config.js` (the URL ending in `/count` on your actual `goatcounter.com` subdomain). No API key is needed or allowed in this public repository. No account has been created for this project.
3. Commit that config file to `main` and wait for Pages deployment.
4. Visit the published page with Do Not Track/Global Privacy Control off and no analytics blocker; verify a page view and action events in your own dashboard. The current integration permits only the published `becool79.github.io` hostname, so local previews do not pollute data.

The integration follows GoatCounter's [JavaScript API](https://www.goatcounter.com/help/js) and [event API](https://www.goatcounter.com/help/events). It sends a fixed page path/title and allowlisted event names: `action-save-contact`, `action-call`, `action-whatsapp`, `action-office-email`, `action-personal-email`, `action-company-website`, `action-view-map`, `action-share-profile`, `action-show-qr`, `action-copy-link`, and `action-download-qr`.

No email address, telephone number, destination URL, query string, fragment or referrer is included in these event fields. The page sets a no-referrer policy, uses no analytics cookies or persistent browser identifiers of its own, and respects Do Not Track and Global Privacy Control. The provider still receives connection information such as IP address and browser headers; review its data practices before enabling. The footer disclosure automatically changes when a valid endpoint is configured.

Click counts mean **attempts**, not completed phone calls, sent emails, successful shares or saved contacts. Visits are page loads, not uniquely identifiable people or NFC scans. Ad blockers, network failures, early navigation and privacy preferences can reduce counts. Analytics is best-effort and never delays navigation. The provider dashboard is the analytics UI; no custom admin dashboard or backend is included.

## Verification

Run `node --test profile.test.cjs` for sharing and privacy/analytics guards (mocked provider, no external data sent). Serve the root with any static server for browser checks.

Before publishing, inspect 320, 360, 375, 390, 412, 430, 768 and 1440px widths, confirm no horizontal overflow or clipped controls, open/close the QR dialog, test copying, and verify all contact links against `contact.vcf`. Reduced-motion users receive no entrance animations or transform feedback. Basic contact links work with JavaScript off. A real phone remains the final check for OS-specific vCard import, native share sheet, telephone and email app behavior.

