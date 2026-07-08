# ETI Platform Build Plan — Customer Journey Sequence

**Approach:** Build in customer-journey order, not "biggest feature first." Each phase should be usable by a real student before you move to the next. Backend (Express/Paystack/PostgreSQL) stays paused and untouched during frontend migration — no rebuilding it.

---

## Phase 0 — Frontend Foundation (Next.js Migration)

- [ ] Set up new Next.js project (App Router, TypeScript)
- [ ] Port existing global CSS in as-is (no rewriting yet)
- [ ] Audit all 40+ HTML files, list every repeated UI chunk
- [ ] Build shared component: `<Navbar />`
- [ ] Build shared component: `<Footer />`
- [ ] Build shared component: `<CourseCard />`
- [ ] Build shared component: `<PricingCard />`
- [ ] Build shared component: `<CTASection />`
- [ ] Migrate Homepage using shared components
- [ ] Migrate Course Catalog page
- [ ] Migrate Pricing page
- [ ] Set up per-page metadata (fixes old meta tag issues permanently)
- [ ] Migrate remaining marketing pages (About, Contact, Cybersecurity, etc.)

---

## Phase 1 — Discovery & Interest

*(Mostly content, already largely covered by your frontend audit)*

- [ ] Confirm course catalog page shows accurate, non-inflated stats
- [ ] Confirm all testimonials are real, not repeated personas
- [ ] Confirm all trust-signal links work (no dead links)
- [ ] Add/confirm demo lesson or free mini-course preview
- [ ] SEO pass: meta tags, sitemap, robots.txt on all marketing pages

---

## Phase 2 — Lead Capture

- [ ] Newsletter signup component
- [ ] WhatsApp community join CTA (button/link, not full integration yet)
- [ ] Contact/consultation booking form
- [ ] Store leads to your existing PostgreSQL schema (check if a `leads` table already exists)

---

## Phase 3 — Enrollment (finish what's already 80% built)

- [ ] Helmet middleware configured
- [ ] Rate limiting on auth + payment routes
- [ ] Input validation on all public-facing endpoints
- [ ] Wire `enroll.js` with JWT authentication
- [ ] Test full flow: choose course → create account → verify email → pay → receipt
- [ ] Confirm Paystack webhook handling is solid (no silent payment failures)

---

## Phase 4 — Onboarding (NEW — the wizard)

- [ ] Design onboarding wizard flow: Welcome → Track selection → Skill-level check → Goal setting → Meet instructor → First lesson CTA
- [ ] Build wizard as a multi-step component (store progress in state, submit at end)
- [ ] Wizard writes collected data (goals, experience level) to student profile table
- [ ] Trigger wizard automatically right after payment success, before dashboard
- [ ] Welcome email sent on completion
- [ ] "Skip for now" option that still unlocks dashboard (don't block access)

---

## Phase 5 — Learning Experience (MVP slice — not full LMS yet)

- [ ] Lesson content display (video/PDF/text)
- [ ] Assignment submission
- [ ] Basic progress tracking (% complete per course)
- [ ] Quiz functionality
- [ ] Notification: new lesson available
- [ ] Notification: assignment due
- [ ] *Defer for later:* XP system, badges, leaderboards, streaks

---

## Phase 6 — Support (minimal viable version)

- [ ] WhatsApp or Telegram community link inside dashboard
- [ ] Simple contact/help form
- [ ] *Defer for later:* full ticketing system, live chat widget

---

## Phase 7 — Assessment & Certification

- [ ] Final project/capstone submission flow
- [ ] Grading/review mechanism (manual or peer review to start)
- [ ] Certificate generation (Puppeteer — you already planned this)
- [ ] QR code verification for certificates
- [ ] Certificate ID system
- [ ] Downloadable PDF certificate
- [ ] Share-to-LinkedIn / X / Facebook buttons

---

## Phase 8 — Alumni & Advocacy (defer until you have real alumni)

- [ ] Alumni portal (basic directory or badge)
- [ ] Referral system
- [ ] Testimonial collection flow from graduates
- [ ] *Defer further:* job board, mentorship matching, affiliate program

---

## Notes
- Don't build Phase 5's gamification or Phase 8 before you have students in Phase 4-5 — that's effort spent on stages nobody's reached yet.
- Revisit backend security hardening (Phase 3) once frontend structure is stable — don't rebuild backend from scratch.
- Onboarding wizard data feeds directly into your CRM/nurturing efforts later — worth designing the data fields carefully now.
