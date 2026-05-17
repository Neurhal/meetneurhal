# NeurHAL.NET Static Deployment Security Notes

This directory is intended to remain a static public research and review surface. The low-attack-surface posture is intentional: no analytics, no public upload intake, no third-party scripts, no remote fonts, and no backend form processor are required for the standalone frontend.

## Expected deployment posture

- Serve only over HTTPS.
- Redirect HTTP to HTTPS before content is served.
- Use a restrictive Content Security Policy.
- Deny framing to reduce clickjacking risk.
- Disable unnecessary browser permissions.
- Avoid third-party analytics, trackers, remote widgets, and cloud form processors.
- Keep detailed technical and investor-review materials in private review channels rather than publishing them in the static site.

## Release artifact

The public artifact should remain limited to the static site surface:

- `index.html`
- `styles.css`
- `mobile.css`
- `app.js`
- `hexring-mark.svg`
- `_headers`
- `.nojekyll`

## Suggested security headers

The `_headers` file contains a static-host header set for platforms that support Netlify/Cloudflare-style header files. GitHub Pages does not consume this file directly; equivalent headers should be configured at the CDN, static host, or reverse proxy when the target platform does not apply it.

Recommended baseline:

```text
Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'none'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'none'; upgrade-insecure-requests
X-Content-Type-Options: nosniff
Referrer-Policy: no-referrer
Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=(), serial=(), bluetooth=()
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Frame-Options: DENY
Cross-Origin-Opener-Policy: same-origin
```

`style-src 'unsafe-inline'` is currently retained for compatibility with dynamic tooltip positioning and browser-native form controls. If tooltip positioning is refactored to avoid inline style updates, this can be tightened further.

## Contact workflow

The contact modal creates a local `mailto:` draft. The website does not submit form data to a backend service. Once the user sends the draft, message handling, metadata, retention, and delivery are governed by the sender's email provider, routing infrastructure, and the receiving mailbox.

The public form should remain limited to initial contact and review-routing context. Credentials, controlled data, confidential architecture materials, detailed security findings, and sensitive technical documents should not be sent through the initial inquiry.
