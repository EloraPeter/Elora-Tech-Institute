(function initETIUI(global) {
    const doc = global.document;

    if (!doc) {
        return;
    }

    const footerLinks = [
        { href: 'about.html', text: 'About' },
        { href: 'courses.html', text: 'Courses' },
        { href: 'admissions.html', text: 'Admissions' },
        { href: 'contact.html', text: 'Contact' },
        { href: 'faq.html', text: 'FAQ' },
        { href: 'teach-online.html', text: 'Teach on ETI' },
        { href: 'blog&updates.html', text: 'Blog' },
        { href: 'help-support.html', text: 'Help & Support' }
    ];

    const socialLinks = [
        { href: 'https://web.facebook.com/profile.php?id=61574697245670', icon: 'fa-facebook', label: 'Facebook' },
        { href: '#', icon: 'fa-instagram', label: 'Instagram' },
        { href: 'https://www.linkedin.com/in/florence-ofuokwu-908129316/', icon: 'fa-linkedin', label: 'LinkedIn' },
        { href: 'https://github.com/EloraPeter?tab=repositories', icon: 'fa-github', label: 'GitHub' }
    ];

    function getUser() {
        try {
            return JSON.parse(global.localStorage.getItem('user'));
        } catch (error) {
            console.error('Unable to parse stored user:', error);
            return null;
        }
    }

    function getDashboardHref(role) {
        if (role === 'admin') return 'admin-dashboard.html';
        if (role === 'instructor') return 'tutor-dashboard.html';
        return 'student-dashboard.html';
    }

    function createHeaderMarkup() {
        return `
            <div class="ui-header-shell">
                <nav id="navbar" role="navigation" aria-label="Main navigation">
                    <h1 id="logo">
                        <a href="index.html">
                            <img src="images/eti logo main.jfif" alt="Elora Tech Institute Logo">
                        </a>
                    </h1>
                    <button class="menu-toggle" aria-label="Toggle menu" aria-expanded="false">
                        <i class="fa-solid fa-bars"></i>
                    </button>
                    <ul id="nav-link" role="menu"></ul>
                    <div class="ui-header-actions">
                        <div class="ui-header-user" hidden data-ui-user-menu>
                            <button class="ui-header-user__trigger" type="button" aria-expanded="false">
                                <img id="dashboard-profile-picture" class="ui-header-user__avatar dashboard-profile-picture" src="images/avatars/default.jpg" alt="User avatar">
                                <span class="ui-header-user__meta">
                                    <strong data-ui-user-name>Account</strong>
                                    <span data-ui-user-role>Member</span>
                                </span>
                                <i class="fa-solid fa-chevron-down" aria-hidden="true"></i>
                            </button>
                            <div class="ui-header-user__menu" role="menu">
                                <a href="profile.html">
                                    <span>Profile</span>
                                    <i class="fa-solid fa-user"></i>
                                </a>
                                <a href="student-dashboard.html" data-ui-dashboard-link>
                                    <span>Dashboard</span>
                                    <i class="fa-solid fa-arrow-right"></i>
                                </a>
                                <button type="button" data-ui-logout>
                                    <span>Logout</span>
                                    <i class="fa-solid fa-right-from-bracket"></i>
                                </button>
                            </div>
                        </div>
                        <div id="toggle" class="ui-theme-toggle" title="Toggle theme">
                            <i class="fa-solid fa-moon"></i>
                        </div>
                    </div>
                </nav>
                <aside id="sidebar-nav">
                    <ul class="links"></ul>
                </aside>
            </div>
        `;
    }

    function createFooterMarkup() {
        const links = footerLinks.map((link) => `<li><a href="${link.href}">${link.text}</a></li>`).join('');
        const socials = socialLinks.map((link) => `
            <li>
                <a href="${link.href}" target="_blank" rel="noreferrer" aria-label="${link.label}">
                    <i class="fab ${link.icon}"></i>
                </a>
            </li>
        `).join('');

        return `
            <footer class="ui-footer">
                <div class="ui-footer__grid">
                    <section class="ui-footer__section">
                        <span class="ui-footer__eyebrow">Elora Tech Institute</span>
                        <h2 class="ui-footer__title">A practical learning platform for future builders.</h2>
                        <p class="ui-footer__text">
                            Elora Tech Institute equips learners with in-demand skills across web development,
                            cybersecurity, AI, Web3, and IoT through hands-on projects, flexible learning, and
                            career-focused support.
                        </p>
                        <ul class="ui-footer__socials">${socials}</ul>
                    </section>
                    <section class="ui-footer__section">
                        <h3 class="ui-footer__heading">Discover ETI</h3>
                        <ul class="ui-footer__links">${links}</ul>
                    </section>
                    <section class="ui-footer__section">
                        <h3 class="ui-footer__heading">How to Apply</h3>
                        <ol class="ui-footer__steps">
                            <li>Explore our programs and choose a path that fits your goals.</li>
                            <li>Complete the registration form and secure your place.</li>
                            <li>Confirm payment and begin your learning journey with ETI.</li>
                        </ol>
                        <div class="ui-footer__cta">
                            <a href="https://docs.google.com/forms/d/e/1FAIpQLSfH5Ofy75Le_UUQyE4kDCSOSIb7McKldQPkD47OOXekt1veMw/viewform?usp=sharing" class="btn" target="_blank" rel="noreferrer">Register Now</a>
                        </div>
                    </section>
                </div>
                <div class="ui-footer__bottom">
                    <p>&copy; Elora Tech Institute 2023 - 2025. All rights reserved.</p>
                    <p>Created by <a href="https://elorapeter.github.io/hackaton-portfolio/" target="_blank" rel="noreferrer">Elora</a>.</p>
                </div>
            </footer>
        `;
    }

    function ensureRoot(className, selector) {
        let root = doc.querySelector(selector);
        if (!root) {
            root = doc.createElement('div');
            root.className = className;
            doc.body.appendChild(root);
        }
        return root;
    }

    function closeUserMenus() {
        doc.querySelectorAll('.ui-header-user.is-open').forEach((menu) => {
            menu.classList.remove('is-open');
            const trigger = menu.querySelector('.ui-header-user__trigger');
            if (trigger) {
                trigger.setAttribute('aria-expanded', 'false');
            }
        });
    }

    function hydrateUserMenu() {
        const userMenu = doc.querySelector('[data-ui-user-menu]');
        if (!userMenu) {
            return;
        }

        const user = getUser();
        const token = global.localStorage.getItem('token');

        if (!user || !token) {
            userMenu.hidden = true;
            return;
        }

        userMenu.hidden = false;
        const avatar = userMenu.querySelector('.ui-header-user__avatar');
        const name = userMenu.querySelector('[data-ui-user-name]');
        const role = userMenu.querySelector('[data-ui-user-role]');
        const dashboardLink = userMenu.querySelector('[data-ui-dashboard-link]');
        const trigger = userMenu.querySelector('.ui-header-user__trigger');
        const logoutButton = userMenu.querySelector('[data-ui-logout]');

        if (avatar) {
            avatar.src = user.profile_picture_url || user.photo_url || 'images/avatars/default.jpg';
        }
        if (name) {
            name.textContent = user.name || 'ETI Member';
        }
        if (role) {
            role.textContent = user.role || 'member';
        }
        if (dashboardLink) {
            dashboardLink.href = getDashboardHref(user.role);
        }

        if (trigger && !trigger.dataset.bound) {
            trigger.dataset.bound = 'true';
            trigger.addEventListener('click', () => {
                const nextState = !userMenu.classList.contains('is-open');
                closeUserMenus();
                userMenu.classList.toggle('is-open', nextState);
                trigger.setAttribute('aria-expanded', String(nextState));
            });
        }

        if (logoutButton && !logoutButton.dataset.bound) {
            logoutButton.dataset.bound = 'true';
            logoutButton.addEventListener('click', async () => {
                closeUserMenus();
                if (typeof global.logout === 'function') {
                    await global.logout();
                    return;
                }

                global.localStorage.removeItem('token');
                global.localStorage.removeItem('refreshToken');
                global.localStorage.removeItem('user');
                global.location.href = 'login-signup.html';
            });
        }
    }

    function mountHeader(target) {
        target.innerHTML = createHeaderMarkup();
    }

    function mountFooter(target) {
        target.classList.add('ui-site-footer');
        target.innerHTML = createFooterMarkup();
    }

    function mountPlaceholders() {
        doc.querySelectorAll('[data-ui-header]').forEach((node) => mountHeader(node));
        doc.querySelectorAll('[data-ui-footer]').forEach((node) => mountFooter(node));
        hydrateUserMenu();
    }

    function toast(message, options = {}) {
        const {
            type = 'info',
            title = type === 'error' ? 'Request failed' : 'Update',
            duration = 3200
        } = options;

        const root = ensureRoot('ui-toast-root', '.ui-toast-root');
        const toastEl = doc.createElement('article');
        toastEl.className = `ui-toast ui-toast-${type}`;
        toastEl.setAttribute('role', 'status');
        toastEl.innerHTML = `
            <h3 class="ui-toast__title">${title}</h3>
            <p class="ui-toast__message">${message}</p>
        `;
        root.appendChild(toastEl);

        global.requestAnimationFrame(() => {
            toastEl.classList.add('is-visible');
        });

        global.setTimeout(() => {
            toastEl.classList.remove('is-visible');
            global.setTimeout(() => toastEl.remove(), 180);
        }, duration);

        return toastEl;
    }

    function setGlobalLoading(isLoading, options = {}) {
        const root = ensureRoot('ui-loader-root', '.ui-loader-root');
        const label = options.label || 'Loading...';

        if (!root.dataset.initialized) {
            root.dataset.initialized = 'true';
            root.innerHTML = `
                <div class="ui-loader" role="status" aria-live="polite">
                    <span class="ui-spinner" aria-hidden="true"></span>
                    <span data-ui-loader-label>${label}</span>
                </div>
            `;
        }

        const textNode = root.querySelector('[data-ui-loader-label]');
        if (textNode) {
            textNode.textContent = label;
        }

        root.classList.toggle('is-visible', isLoading);
        root.setAttribute('aria-hidden', String(!isLoading));
    }

    function closeModal(modalRoot, resolver, result) {
        modalRoot.classList.remove('is-visible');
        global.setTimeout(() => {
            modalRoot.remove();
            resolver(result);
        }, 180);
    }

    function openModal(options = {}) {
        const {
            title = 'Notice',
            message = '',
            confirmText = 'Confirm',
            cancelText = 'Cancel',
            variant = 'confirm',
            bodyHTML = '',
            formSelector = '[data-ui-modal-form]'
        } = options;

        return new Promise((resolve) => {
            const root = doc.createElement('div');
            root.className = 'ui-modal-root';
            root.innerHTML = `
                <div class="ui-modal-backdrop" data-ui-dismiss></div>
                <section class="ui-modal" role="dialog" aria-modal="true" aria-label="${title}">
                    <div class="ui-modal__header">
                        <div>
                            <h2 class="ui-modal__title">${title}</h2>
                        </div>
                        <button type="button" class="ui-modal__close" data-ui-dismiss aria-label="Close">
                            <i class="fa-solid fa-xmark"></i>
                        </button>
                    </div>
                    <div class="ui-modal__body">
                        ${bodyHTML || `<p>${message}</p>`}
                    </div>
                    <div class="ui-modal__footer">
                        ${variant === 'alert' ? '' : `<button type="button" class="ui-btn ui-btn-ghost" data-ui-cancel>${cancelText}</button>`}
                        <button type="button" class="ui-btn ui-btn-primary" data-ui-confirm>${confirmText}</button>
                    </div>
                </section>
            `;

            doc.body.appendChild(root);
            global.requestAnimationFrame(() => {
                root.classList.add('is-visible');
            });

            root.querySelectorAll('[data-ui-dismiss], [data-ui-cancel]').forEach((button) => {
                button.addEventListener('click', () => closeModal(root, resolve, false));
            });

            root.querySelector('[data-ui-confirm]').addEventListener('click', () => {
                if (variant === 'form') {
                    const form = root.querySelector(formSelector);
                    if (!form) {
                        closeModal(root, resolve, {});
                        return;
                    }

                    if (typeof form.reportValidity === 'function' && !form.reportValidity()) {
                        return;
                    }

                    closeModal(root, resolve, Object.fromEntries(new FormData(form).entries()));
                    return;
                }

                closeModal(root, resolve, true);
            });
        });
    }

    function confirm(options) {
        return openModal({ ...options, variant: 'confirm' });
    }

    function alert(options) {
        return openModal({ ...options, variant: 'alert', cancelText: '' });
    }

    function form(options) {
        return openModal({ ...options, variant: 'form' });
    }

    const ETIUI = {
        mountHeader,
        mountFooter,
        mountPlaceholders,
        hydrateUserMenu,
        toast,
        openModal,
        confirm,
        alert,
        form,
        setGlobalLoading
    };

    global.ETIUI = ETIUI;

    doc.addEventListener('click', (event) => {
        if (!event.target.closest('.ui-header-user')) {
            closeUserMenus();
        }
    });

    doc.addEventListener('DOMContentLoaded', () => {
        mountPlaceholders();
    });
})(window);
