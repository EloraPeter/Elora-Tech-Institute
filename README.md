<!DOCTYPE html>
<html>
  <head>
    <meta http-equiv="refresh" content="0; url=frontend/index.html" />
  </head>
  <body>
    <p>If you are not redirected, <a href="frontend/index.html">click here</a>.</p>
  </body>
</html>

https://elorapeter.github.io/Elora-Tech-Institute/

## Core Decisions

- Payments: Paystack
- Course/media thumbnails: Cloudinary
- Transactional email provider: Resend (fallback option: Brevo)
- Frontend global state: React Context API (with reducer pattern where state is complex)

### Why These Choices

- Paystack: best fit for local payment flows and expected user checkout experience.
- Cloudinary: reliable image hosting, optimization, and easy CDN delivery for course thumbnails.
- Resend: simple transactional email API and developer-friendly setup.
- Context API: enough for current app scale without introducing extra state libraries too early.
