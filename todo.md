1. Current Site Fixes & Marketing Landing Polish (Do these first – unblocks perception & early signups)

 - [ ] Add real prices (e.g. ₦150,000–₦450,000) and durations (e.g. 8–16 weeks) to all 3 courses in HTML (Frontend/Content)
- [ ] Replace all # "Read More" anchors with actual /courses/frontend-development-bootcamp style links (create placeholder HTML pages if needed) (Frontend)
- [ ] Change "Enroll Now" and "Apply Now" buttons to link to new /register instead of Google Form (phase out form later) (Frontend)
- [ ] Add proper <title>, <meta description>, Open Graph & Twitter Card tags to index.html (Frontend/SEO)
- [ ] Add favicon.ico + apple-touch-icon (Frontend)
- [ ] Insert course thumbnails (upload to Cloudinary or /assets/, add <img> tags) (Frontend/Content)
- [ ] Fix duplicate "Michael O." in testimonials → assign unique names/roles or add photos (Content)
- [ ] Turn testimonials into a simple CSS carousel/slider (vanilla JS or tiny lib like Swiper) (Frontend)
- [ ] Add social media icons/links + email/phone to footer (Frontend)
- [ ] Add copyright "© 2026 Elora Tech Institute. All rights reserved." + links to /privacy-policy and /terms-of-service (create placeholder pages) (Frontend)
- [ ] Make site fully mobile-responsive (media queries, hamburger menu if adding nav) (Frontend/Designer)
- [ ] Add basic accessibility: alt text on future images, ARIA labels on buttons, keyboard navigation test (Frontend)

2. Global Setup & Shared Utilities

- [x] Document final decisions in README.md or docs/decision-log.md: Paystack, Cloudinary thumbnails, Brevo/Resend for email, Context API for state (Lead/Fullstack)
- [x] Create /assets/ folder structure: images/, css/, js/, fonts/ (Frontend)
- [x] Set up backend folder: controllers/, routes/, models/, middleware/, services/, config/, utils/, server.js (Backend)
- [x] Initialize PostgreSQL (local + hosted e.g. Supabase/Neon) + first migration (users table at minimum) (Backend)
- [x] Install core backend deps: express, cors, helmet, rate-limit, bcrypt, jwt, pg/prisma, dotenv, nodemailer/brevo (Backend)
- [ ] Create api.js fetch wrapper (baseURL, token auto-attach, toast on error, loading flag) (Frontend)
- [ ] Build global UI kit components:
- [ ] Header (logo + future nav + auth/user dropdown)
- [ ]Footer (updated)
- [ ]Toast notification
- [ ]Modal (confirm, alert, form)
- [ ]Spinner + skeleton loaders (Frontend/Designer)


- [ ] Add dark mode toggle (CSS variables + localStorage persist) – optional but high UX impact (Frontend)

3. Authentication & User Management

- [ ] Backend: User model (id, name, email, password_hash, role: 'student'|'admin'|'instructor', photo_url, bio, created_at) (Backend)
- [ ] Backend: POST /auth/register – validate, hash pw, create user, send welcome email, return JWT (Backend)
- [ ] Backend: POST /auth/login – verify, return JWT + user basics (Backend)
- [ ] Backend: GET /auth/profile – protected (Backend)
- [ ] Backend: PATCH /auth/profile – update name/photo/bio (multer/cloudinary for photo) (Backend)
- [ ] Backend: Forgot/reset password flow (token in email, expiry 1h) (Backend)
- [ ] Backend: JWT middleware + role-based protection (Backend)
- [ ] Frontend: /register page + form validation + API call + redirect to login (Frontend)
- [ ] Frontend: /login page + "Remember me" + token storage (localStorage + httpOnly cookie fallback?) (Frontend)
- [ ] Frontend: Protected route HOC/wrapper (check token, redirect to login) (Frontend)
- [ ] Frontend: /forgot-password & /reset-password/:token pages (Frontend)
- [ ] Frontend: User dropdown in header (profile, dashboard, logout) after login (Frontend)

4. Courses Discovery & Details

- [ ] Backend: Category model (id, name, slug) + Course model (id, title, slug, description, price, duration_weeks, category_id, instructor_id, thumbnail_url, what_you_learn json/array, is_published, created_at) (Backend)
- [ ] Backend: Instructor model (id, name, bio, photo_url, social_links json) (Backend)
- [ ] Backend: Full CRUD /courses (admin protected for CUD) + GET /courses (public, filters: category, search, sort) (Backend)
- [ ] Backend: GET /courses/:slug – detailed with instructor, category (Backend)
- [ ] Frontend: /courses listing – grid, search bar, category chips/filter, sort (price, rating, newest) (Frontend)
- [ ] Frontend: /courses/:slug detail page – hero (thumbnail/video embed, price, enroll CTA), what-you-learn list, curriculum preview accordion (placeholder), instructor bio card, reviews placeholder, enroll button (Frontend)

5. Curriculum & Content Structure

- [ ] Backend: Module model (id, course_id, title, position, description) (Backend)
- [ ] Backend: Lesson model (id, module_id, title, position, type: 'video'|'text'|'quiz', video_id, content_md, duration_min, is_preview, is_required) (Backend)
- [ ] Backend: CRUD endpoints for modules & lessons (admin only) (Backend)
- [ ] Instructor dashboard
- [ ] Admin: Basic forms/pages to create/edit course → add modules → add lessons (Frontend + Backend)

6. Video & Learning Experience

- [ ] Backend: Video model if needed (id, cloudflare_id, duration, thumbnail) (Backend)
- [ ] Frontend: /courses/:courseId/learn or /lessons/:lessonId player page – Cloudflare Stream integration, sidebar curriculum (clickable, current highlight), next/prev, mark complete, notes textarea + save (Frontend)
- [ ] Frontend: Video time tracking – heartbeat POST /progress every 30s with currentTime (Frontend)
- [ ] Backend: POST /lesson-progress (update watched %, completed bool) (Backend)

7. Enrollment & Payments (Core Monetization)

- [ ] Backend: Enrollment model (id, user_id, course_id, payment_status, enrolled_at, completed_at?) (Backend)
- [ ] Backend: Paystack – POST /payments/initialize, webhook /payments/verify → create enrollment on success (Backend)
- [ ] Backend: GET /my-courses (enrolled list with progress) (Backend)
- [ ] Frontend: /checkout/:courseId – summary, Paystack popup trigger (Frontend)
- [ ] Frontend: /enrollment/success & /failed pages (show receipt/details) (Frontend)
- [ ] Frontend: /my-courses – cards with continue button to last/unfinished lesson (Frontend)

8. Progress, Completion & Certificates

- [ ] Backend: LessonProgress model + course completion % calc (Backend)
- [ ] Frontend: Progress visuals – circular % on cards, bar on player (Frontend)
- [ ] Backend: Certificate generation (Puppeteer backend or jsPDF frontend → upload to Cloudinary) + model (id, user_id, course_id, pdf_url, verification_code, issued_at) (Backend)
- [ ] Backend + Frontend: /my-certificates list + viewer/download/share (Frontend)
- [ ] Backend + Frontend: Public /certificates/verify/:code page (Frontend)

9. Engagement & Social Proof

- [ ] Backend + Frontend: Reviews – POST /reviews (post-completion), GET /courses/:id/reviews + average rating (Both)
- [ ] Backend + Frontend: Admin CRUD for testimonials + homepage carousel (Both)
- [ ] Backend + Frontend: Simple notifications (model + bell dropdown) – e.g. new enrollment, certificate ready (Both)

10. Admin & Operations

- [ ] Protected /admin dashboard – stats cards (students, revenue, enrollments, completion rates) (Both)
- [ ] Admin: Users list + search + role change/delete (Backend + Frontend)
- [ ] Admin: Courses/payments overview tables (Backend + Frontend)

11. Marketing & Retention Tools

- [ ] Backend + Frontend: Blog – CRUD + /blog list + /blog/:slug (Both)
- [ ] Frontend + Backend: Newsletter – form + POST /newsletter/subscribe (Both)
- [ ] Frontend + Backend: Contact page/form → email notification (Both)
- [ ] Static pages: /about, /privacy-policy, /terms-of-service, /refund-policy (Frontend/Content)

12. Security, Performance, Scale & Compliance

- [ ] Backend: Rate limiting on auth/payment endpoints (Backend)
- [ ] Backend: Input validation (zod/joi), helmet, XSS/sanitization (Backend)
- [ ] Frontend: Lazy load images/videos, code splitting if using bundler (Frontend)
- [ ] Add robots.txt + auto-generate sitemap.xml (Backend or build script)
- [ ] Basic PWA: manifest.json + service worker (cache assets) (Frontend)
- [ ] Ensure GDPR/Nigeria data protection basics: consent for cookies/newsletter, privacy policy content (Content/Legal)

13. Post-MVP / V2 Nice-to-Haves (After launch & feedback)

- [ ] Quizzes/assignments per lesson
- [ ] Discussion/comments per lesson
- [ ] Drip content release
- [ ] Wishlist/favorites
- [ ] AI recommendations or summaries (future)
- [ ] Gamification (badges, streaks)
- [ ] Mobile app shell or deeper PWA
