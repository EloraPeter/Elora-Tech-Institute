// Utility Functions
function throttle(func, wait) {
    let lastCall = 0;
    return function (...args) {
        const now = Date.now();
        if (now - lastCall >= wait) {
            lastCall = now;
            func.apply(this, args);
        }
    };
}

function createMenuItem(item, isSidebar = false) {
    const li = document.createElement('li');
    li.setAttribute('role', item.role);
    if (item.class) li.className = item.class;
    const a = document.createElement('a');
    a.href = item.href;
    if (item.isButton && !isSidebar) a.className = 'btn';
    if (item.onclick) a.setAttribute('onclick', item.onclick);

    // Handle image-based menu item (navbar only)
    if (item.img && !isSidebar) {
        const img = document.createElement('img');
        img.src = item.img;
        img.alt = item.alt || 'Menu icon';
        img.className = 'nav-avatar';
        a.appendChild(img);
    } else {
        // Add icon for sidebar (outside <a>) or navbar (inside <a>)
        if (item.icon) {
            const i = document.createElement('i');
            i.className = `fa-solid ${item.icon}`;
            if (isSidebar) {
                li.appendChild(i); // Icon outside <a> for sidebar
            } else {
                a.appendChild(i); // Icon inside <a> for navbar
            }
        }
        // Add text
        a.appendChild(document.createTextNode(item.text));
    }

    // Handle dropdowns (navbar only)
    if (item.submenu && !isSidebar) {
        li.setAttribute('aria-haspopup', 'true');
        li.setAttribute('aria-expanded', 'false');
        li.classList.add('dropdown-parent');
        const i = document.createElement('i');
        i.className = 'fa-solid fa-chevron-down';
        a.appendChild(i);
        const div = document.createElement('div');
        div.className = item.class && item.class.includes('main') ? 'dropdown1' : 'dropdown2';
        const ul = document.createElement('ul');
        ul.className = item.class && item.class.includes('main') ? 'dropdown' : 'dropdown-sub';
        ul.setAttribute('role', 'menu');
        item.submenu.forEach(subItem => ul.appendChild(createMenuItem(subItem)));
        div.appendChild(ul);
        li.appendChild(div);
    }

    li.appendChild(a);
    return li;
}

function parseJWT(token) {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
            atob(base64)
                .split('')
                .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                .join('')
        );
        return JSON.parse(jsonPayload);
    } catch (e) {
        console.error('Error parsing JWT:', e);
        return null;
    }
}

async function getUserRole() {
    const token = localStorage.getItem('token');
    if (!token) return 'guest';

    const decoded = parseJWT(token);
    if (!decoded || !decoded.role || !['student', 'tutor', 'admin'].includes(decoded.role)) {
        localStorage.removeItem('token');
        return 'guest';
    }

    try {
        const response = await fetch(`http://localhost:3000/api/users/${decoded.id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
            const user = await response.json();
            return user.role;
        } else {
            localStorage.removeItem('token');
            return 'guest';
        }
    } catch (err) {
        console.error('Error verifying token:', err);
        localStorage.removeItem('token');
        return 'guest';
    }
}

async function logout() {
    const token = localStorage.getItem('token');
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    try {
        await fetch('http://localhost:3000/api/logout', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });
    } catch (err) {
        console.error('Logout error:', err);
    }
    window.location.href = 'login-signup.html';
}

function addBackButton(dropdown, onClick) {
    if (!dropdown || window.innerWidth > 768) return;
    const existingBack = dropdown.querySelector(".dropdown-back");
    if (existingBack) existingBack.remove();
    const backButton = document.createElement("a");
    backButton.href = "#";
    backButton.className = "dropdown-back";
    backButton.innerHTML = '<i class="fa-solid fa-arrow-left"></i> Back';
    backButton.setAttribute("aria-label", "Back to previous menu");
    backButton.addEventListener("click", (e) => {
        e.preventDefault();
        console.log("Back button clicked");
        onClick();
    });
    dropdown.insertBefore(backButton, dropdown.firstChild);
}

// Main Logic
document.addEventListener("DOMContentLoaded", async () => {
    const navbar = document.getElementById("navbar");
    const navLink = document.querySelector("#nav-link");
    const navbarToggle = document.querySelector(".navbar-toggle");
    const sidebar = document.querySelector("#sidebar-nav");
    const sidebarLinks = sidebar ? sidebar.querySelector(".links") : null;
    const sidebarToggle = document.querySelector(".menu-toggle");

    // Debug element queries
    console.log("Navbar element:", navbar);
    console.log("Nav-link element:", navLink);
    console.log("Navbar toggle element:", navbarToggle);
    console.log("Sidebar element:", sidebar);
    console.log("Sidebar links element:", sidebarLinks);
    console.log("Sidebar toggle element:", sidebarToggle);

    if (!navbar) console.error("Navbar not found");
    if (!navLink) console.error("Nav-link not found");
    if (!navbarToggle) console.warn("Navbar toggle button not found");
    if (!sidebar) console.error("Sidebar element (#sidebar-nav) not found in DOM");
    if (!sidebarLinks) console.error("Sidebar links (.links) not found in DOM");
    if (!sidebarToggle) console.warn("Sidebar toggle button not found");

    let inactivityTimeout;
    let isInteracting = false;
    let isAnimating = false;

    // Handle auth callback
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const refreshToken = urlParams.get('refreshToken');
    if (token && refreshToken) {
        localStorage.setItem('token', token);
        localStorage.setItem('refreshToken', refreshToken);
        window.history.replaceState({}, document.title, window.location.pathname);
    }

    // Render Navbar
    async function renderNavbar() {
        try {
            const role = await getUserRole();
            console.log("User role:", role);
            if (!window.mainNavLinks) {
                console.error("Navigation config not found");
                return;
            }
            const config = window.mainNavLinks[role] || window.mainNavLinks.guest;
            if (!config) {
                console.error("No config for role:", role);
                return;
            }
            navLink.innerHTML = '';
            config.forEach(item => navLink.appendChild(createMenuItem(item)));

            // Dropdown Event Listeners
            document.querySelectorAll(".dropdown-parent.main").forEach((parent) => {
                const link = parent.querySelector("a");
                if (link) {
                    link.addEventListener("click", (e) => {
                        if (window.innerWidth <= 768) {
                            e.preventDefault();
                            navLink.classList.add("slide-left");
                            const dropdown1 = parent.querySelector(".dropdown1");
                            if (dropdown1) {
                                dropdown1.classList.add("active");
                                parent.classList.add("active");
                                parent.setAttribute("aria-expanded", "true");
                                addBackButton(dropdown1, () => {
                                    navLink.classList.remove("slide-left");
                                    dropdown1.classList.remove("active");
                                    parent.classList.remove("active");
                                    parent.setAttribute("aria-expanded", "false");
                                });
                            }
                        }
                    });
                }
            });

            document.querySelectorAll(".dropdown1 .dropdown-parent").forEach((subParent) => {
                const link = subParent.querySelector("a");
                if (link) {
                    link.addEventListener("click", (e) => {
                        if (window.innerWidth <= 768 && link.querySelector("i.fa-chevron-down")) {
                            e.preventDefault();
                            const dropdown1 = subParent.closest(".dropdown1");
                            const dropdown2 = subParent.querySelector(".dropdown2");
                            if (dropdown1 && dropdown2) {
                                dropdown1.classList.remove("active");
                                dropdown2.classList.add("active");
                                subParent.classList.add("active");
                                subParent.setAttribute("aria-expanded", "true");
                                addBackButton(dropdown2, () => {
                                    dropdown1.classList.add("active");
                                    dropdown2.classList.remove("active");
                                    subParent.classList.remove("active");
                                    subParent.setAttribute("aria-expanded", "false");
                                });
                            }
                        }
                    });
                }
            });

            document.querySelectorAll("#nav-link > li:not(.dropdown-parent) a, .dropdown-sub li a").forEach((link) => {
                link.addEventListener("click", () => {
                    if (window.innerWidth <= 768) {
                        navLink.classList.remove("active");
                        navLink.classList.remove("slide-left");
                        document.querySelectorAll(".dropdown-parent").forEach((parent) => {
                            parent.classList.remove("active");
                            parent.setAttribute("aria-expanded", "false");
                        });
                        document.querySelectorAll(".dropdown1, .dropdown2").forEach((dropdown) => {
                            dropdown.classList.remove("active");
                        });
                        if (navbarToggle) {
                            navbarToggle.setAttribute("aria-expanded", "false");
                            navbarToggle.querySelector("i").classList.toggle("fa-bars", true);
                            navbarToggle.querySelector("i").classList.toggle("fa-times", false);
                        }
                    }
                });
            });
        } catch (err) {
            console.error("Error rendering navbar:", err);
        }
    }

    // Render Sidebar
    async function renderSidebar() {
        if (!sidebar || !sidebarLinks) {
            console.error("Cannot render sidebar: #sidebar-nav or .links element is missing");
            return;
        }
        try {
            const role = await getUserRole();
            console.log("Sidebar role:", role);
            if (!window.sidebarNavLinks) {
                console.error("Sidebar config not found");
                sidebar.style.display = 'none';
                return;
            }
            const config = window.sidebarNavLinks[role] || window.sidebarNavLinks.guest;
            if (!config || config.length === 0) {
                console.log("No sidebar config for role:", role);
                sidebar.style.display = 'none';
                return;
            }
            sidebarLinks.innerHTML = '';
            config.forEach((group, index) => {
                const h4 = document.createElement('h4');
                h4.textContent = group.group;
                sidebarLinks.appendChild(h4);
                group.items.forEach(item => {
                    sidebarLinks.appendChild(createMenuItem(item, true));
                });
                // Add HR separator except after the last group
                if (index < config.length - 1) {
                    const hr = document.createElement('hr');
                    sidebarLinks.appendChild(hr);
                }
            });
            sidebar.style.display = 'flex';
        } catch (err) {
            console.error("Error rendering sidebar:", err);
            if (sidebar) {
                sidebar.style.display = 'none';
            }
        }
    }

    await Promise.all([renderNavbar(), renderSidebar()]);

    // Navbar Visibility
    const hideNavbar = () => {
        if (window.scrollY > 0 && !isInteracting && !isAnimating) {
            isAnimating = true;
            navbar.classList.add("hidden");
            setTimeout(() => isAnimating = false, 500);
        }
    };

    const showNavbar = () => {
        if (!navbar.classList.contains("hidden")) return;
        isAnimating = true;
        navbar.classList.remove("hidden");
        updateNavbarTransparency();
        setTimeout(() => isAnimating = false, 500);
    };

    const updateNavbarTransparency = () => {
        navbar.classList.toggle("scrolled", window.scrollY > 0);
    };

    const handleScroll = throttle(() => {
        showNavbar();
        clearTimeout(inactivityTimeout);
        inactivityTimeout = setTimeout(hideNavbar, 2000);
    }, 200);

    const handleInteraction = throttle(() => {
        showNavbar();
        clearTimeout(inactivityTimeout);
        inactivityTimeout = setTimeout(hideNavbar, 4000);
    }, 200);

    window.addEventListener("scroll", handleScroll);
    document.addEventListener("mousemove", handleInteraction);
    document.addEventListener("keydown", handleInteraction);

    navbar.addEventListener("mouseenter", () => {
        isInteracting = true;
        showNavbar();
        clearTimeout(inactivityTimeout);
    });

    navbar.addEventListener("mouseleave", () => {
        isInteracting = false;
        inactivityTimeout = setTimeout(hideNavbar, 4000);
    });

    navbar.addEventListener("touchstart", () => {
        isInteracting = true;
        showNavbar();
        clearTimeout(inactivityTimeout);
    });

    document.addEventListener("touchend", () => {
        isInteracting = false;
        inactivityTimeout = setTimeout(hideNavbar, 4000);
    });

    if (/Mobi|Android/i.test(navigator.userAgent)) {
        showNavbar();
        clearTimeout(inactivityTimeout);
        window.removeEventListener("scroll", handleScroll);
    }

    // Navbar Toggle
    if (navbarToggle && navLink) {
        navbarToggle.addEventListener("click", () => {
            navLink.classList.toggle("active");
            const isExpanded = navLink.classList.contains("active");
            navbarToggle.setAttribute("aria-expanded", isExpanded);
            navbarToggle.querySelector("i").classList.toggle("fa-bars");
            navbarToggle.querySelector("i").classList.toggle("fa-times");
            if (!isExpanded) {
                navLink.classList.remove("slide-left");
                document.querySelectorAll(".dropdown-parent").forEach((parent) => {
                    parent.classList.remove("active");
                    parent.setAttribute("aria-expanded", "false");
                });
                document.querySelectorAll(".dropdown1, .dropdown2").forEach((dropdown) => {
                    dropdown.classList.remove("active");
                });
            }
        });
    }

    // Sidebar Toggle
    if (sidebarToggle && sidebar) {
        sidebarToggle.addEventListener("click", () => {
            sidebar.classList.toggle("active");
            const isExpanded = sidebar.classList.contains("active");
            sidebarToggle.setAttribute("aria-expanded", isExpanded);
            sidebarToggle.querySelector("i").classList.toggle("fa-bars");
            sidebarToggle.querySelector("i").classList.toggle("fa-times");
        });
    }

    // Dark Mode Toggle
    const toggleDark = document.querySelector("#toggle");
    if (toggleDark) {
        function updateDarkMode(isDark) {
            document.body.classList.toggle("dark", isDark);
            toggleDark.innerHTML = isDark
                ? '<i class="fa-solid fa-sun"></i>'
                : '<i class="fa-solid fa-moon"></i>';
            localStorage.setItem("darkMode", isDark);
        }
        const savedMode = localStorage.getItem("darkMode");
        const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        updateDarkMode(savedMode === "true" || (savedMode === null && prefersDark));
        toggleDark.addEventListener("click", () =>
            updateDarkMode(!document.body.classList.contains("dark"))
        );
    }

    // Initial Setup
    updateNavbarTransparency();
});