function renderMainNav(role) {
  const navList = document.getElementById('nav-link');
  navList.innerHTML = '';

  mainNavLinks[role].forEach(item => {
    if (item.text === 'Logo (Homepage)') return; // Skip logo (handled in HTML)

    const li = document.createElement('li');
    li.setAttribute('role', item.role);
    if (item.class) li.className = item.class;

    if (item.submenu) {
      li.setAttribute('aria-haspopup', 'true');
      li.setAttribute('aria-expanded', 'false');

      const a = document.createElement('a');
      a.href = item.href;
      a.textContent = item.text;
      li.appendChild(a);

      const dropdown = document.createElement('div');
      dropdown.className = 'dropdown';
      const ul = document.createElement('ul');
      ul.setAttribute('role', 'menu');

      item.submenu.forEach(subItem => {
        const subLi = document.createElement('li');
        subLi.setAttribute('role', subItem.role);
        const subA = document.createElement('a');
        subA.href = subItem.href;
        subA.textContent = subItem.text;
        if (subItem.class) subA.className = subItem.class;
        if (subItem.onclick) subA.setAttribute('onclick', subItem.onclick);
        subLi.appendChild(subA);
        ul.appendChild(subLi);
      });

      dropdown.appendChild(ul);
      li.appendChild(dropdown);
    } else if (item.img && item.class === 'dashboard-profile-picture') {
      const img = document.createElement('img');
      img.src = item.img;
      img.alt = item.alt;
      img.style.cursor = 'pointer';
      img.onclick = () => window.location.href = item.href;
      li.appendChild(img);
    } else {
      const a = document.createElement(item.isButton && !item.href ? 'button' : 'a');
      if (item.href && item.href !== '#') a.href = item.href;
      a.textContent = item.text;
      if (item.class === 'enroll-btn') a.className = 'btn';
      if (item.class === 'toggle') a.innerHTML = '<i class="fa-solid fa-moon"></i>';
      if (item.onclick) a.setAttribute('onclick', item.onclick);
      li.appendChild(a);
    }

    navList.appendChild(li);
  });
}

function renderSidebar(role) {
  const sidebar = document.querySelector('.sidebar');
  const logoDiv = sidebar.querySelector('.logo');
  const linksUl = sidebar.querySelector('.links');

  // Skip sidebar rendering for guest
  if (role === 'guest' || !sidebarNavLinks[role].length) {
    sidebar.style.display = 'none';
    document.querySelector('.menu-toggle').style.display = 'none';
    return;
  }

  // Render logo
  const logoItem = mainNavLinks[role].find(item => item.logoText);
  if (logoItem) {
    logoDiv.innerHTML = `
          <a href="${logoItem.href}">
            <img src="${logoItem.img}" alt="${logoItem.alt}">
            <h2>${logoItem.logoText}</h2>
          </a>
        `;
  }

  // Render sidebar links
  linksUl.innerHTML = '';
  sidebarNavLinks[role].forEach(group => {
    const h4 = document.createElement('h4');
    h4.textContent = group.group;
    linksUl.appendChild(h4);

    group.items.forEach(item => {
      const li = document.createElement('li');
      li.setAttribute('role', item.role);
      li.innerHTML = `
            <i class="fa-solid ${item.icon}"></i>
            <a href="${item.href}"${item.onclick ? ` onclick="${item.onclick}"` : ''}>${item.text}</a>
          `;
      linksUl.appendChild(li);
    });

    const hr = document.createElement('hr');
    linksUl.appendChild(hr);
  });
}

// Toggle sidebar on mobile
const menuToggle = document.querySelector('.menu-toggle');
const sidebar = document.querySelector('.sidebar');
menuToggle.addEventListener('click', () => {
  sidebar.classList.toggle('active');
  const isExpanded = sidebar.classList.contains('active');
  menuToggle.setAttribute('aria-expanded', isExpanded);
});


//-----------------------------------------------------------------------------------------------------------------------------------------------------------------------

// ```javascript
// nav.js

// Main navigation links for the top navbar
const mainNavLinks = {
  guest: [
    {
      text: 'Logo (Homepage)',
      href: 'index.html',
      role: 'menuitem',
      img: 'images/eti logo main.jfif',
      alt: 'ETI Logo',
      logoText: 'ETI'
    },
    { text: 'Home', href: 'index.html', role: 'menuitem', class: 'nb' },
    { text: 'About', href: 'about.html', role: 'menuitem', class: 'nb' },
    {
      text: 'Courses',
      href: 'courses.html',
      role: 'menuitem',
      ariaHaspopup: true,
      ariaExpanded: false,
      class: 'dropdown-parent main nb',
      submenu: [
        // Course submenus omitted for brevity
      ]
    },
    { text: 'Admissions', href: 'admissions.html', role: 'menuitem', class: 'nb' },
    { text: 'Contact', href: 'contact.html', role: 'menuitem', class: 'nb' },
    { text: 'Enroll Now', href: 'login-signup.html', role: 'menuitem', class: 'enroll-btn', isButton: true },
    { text: 'Theme Toggle', href: '#', role: 'menuitem', class: 'toggle', isButton: true }
  ],
  tutor: [
    {
      text: 'Logo (Homepage)',
      href: 'index.html',
      role: 'menuitem',
      img: 'images/eti logo main.jfif',
      alt: 'ETI Logo',
      logoText: 'ETI'
    },
    { text: 'Dashboard', href: 'tutor-dashboard.html', role: 'menuitem', class: 'nb' },
    { text: 'My Courses', href: 'tutor-courses.html', role: 'menuitem', class: 'nb' },
    { text: 'Create', href: 'tutor-create.html', role: 'menuitem', class: 'nb' },
    {
      text: 'Profile Picture',
      href: 'tutor-profile.html',
      role: 'menuitem',
      class: 'dashboard-profile-picture',
      isButton: true,
      img: 'images/avatars/default.jpg',
      alt: 'Profile Picture'
    },
    {
      text: 'Profile',
      href: '#',
      role: 'menuitem',
      ariaHaspopup: true,
      ariaExpanded: false,
      class: 'dropdown-parent',
      submenu: [
        { text: 'Profile', href: 'tutor-profile.html', role: 'menuitem' },
        { text: 'Settings', href: 'tutor-settings.html', role: 'menuitem' },
        { text: 'Logout', href: '#', role: 'menuitem', class: 'enroll-btn', isButton: true, onclick: 'logout()' }
      ]
    },
    { text: 'Theme Toggle', href: '#', role: 'menuitem', class: 'toggle', isButton: true }
  ],
  student: [
    {
      text: 'Logo (Homepage)',
      href: 'index.html',
      role: 'menuitem',
      img: 'images/eti logo main.jfif',
      alt: 'ETI Logo',
      logoText: 'ETI'
    },
    { text: 'Dashboard', href: 'student-dashboard.html', role: 'menuitem', class: 'nb' },
    { text: 'My Courses', href: 'student-courses.html', role: 'menuitem', class: 'nb' },
    { text: 'Explore', href: 'student-explore.html', role: 'menuitem', class: 'nb' },
    {
      text: 'Profile Picture',
      href: 'student-profile.html',
      role: 'menuitem',
      class: 'dashboard-profile-picture',
      isButton: true,
      img: 'images/avatars/default.jpg',
      alt: 'Profile Picture'
    },
    {
      text: 'Profile',
      href: '#',
      role: 'menuitem',
      ariaHaspopup: true,
      ariaExpanded: false,
      class: 'dropdown-parent',
      submenu: [
        { text: 'Profile', href: 'student-profile.html', role: 'menuitem' },
        { text: 'Settings', href: 'student-settings.html', role: 'menuitem' },
        { text: 'Calendar', href: 'student-calendar.html', role: 'menuitem' },
        { text: 'Logout', href: '#', role: 'menuitem', class: 'enroll-btn', isButton: true, onclick: 'logout()' }
      ]
    },
    { text: 'Enroll Now', href: 'login-signup.html', role: 'menuitem', class: 'enroll-btn', isButton: true },
    { text: 'Theme Toggle', href: '#', role: 'menuitem', class: 'toggle', isButton: true }
  ],
  admin: [
    {
      text: 'Logo (Homepage)',
      href: 'index.html',
      role: 'menuitem',
      img: 'images/eti logo main.jfif',
      alt: 'ETI Logo',
      logoText: 'ETI'
    },
    { text: 'Dashboard', href: 'admin-dashboard.html', role: 'menuitem', class: 'nb' },
    { text: 'Courses', href: 'admin-courses.html', role: 'menuitem', class: 'nb' },
    { text: 'Blog', href: 'admin-blog.html', role: 'menuitem', class: 'nb' },
    {
      text: 'Profile Picture',
      href: 'admin-profile.html',
      role: 'menuitem',
      class: 'dashboard-profile-picture',
      isButton: true,
      img: 'images/avatars/default.jpg',
      alt: 'Profile Picture'
    },
    {
      text: 'Profile',
      href: '#',
      role: 'menuitem',
      ariaHaspopup: true,
      ariaExpanded: false,
      class: 'dropdown-parent',
      submenu: [
        { text: 'Profile', href: 'admin-profile.html', role: 'menuitem' },
        { text: 'Settings', href: 'admin-settings.html', role: 'menuitem' },
        { text: 'Logout', href: '#', role: 'menuitem', class: 'enroll-btn', isButton: true, onclick: 'logout()' }
      ]
    },
    { text: 'Theme Toggle', href: '#', role: 'menuitem', class: 'toggle', isButton: true }
  ]
};

// Sidebar navigation links for the aside
const sidebarNavLinks = {
  guest: [], // No sidebar for Guest
  tutor: [
    {
      group: 'Account',
      items: [
        { text: 'Dashboard', href: 'tutor-dashboard.html', role: 'menuitem', icon: 'fa-house' },
        { text: 'My Courses', href: 'tutor-courses.html', role: 'menuitem', icon: 'fa-book' },
        { text: 'Create Course', href: 'tutor-create.html', role: 'menuitem', icon: 'fa-plus' },
        { text: 'Earnings', href: 'tutor-earnings.html', role: 'menuitem', icon: 'fa-wallet' }
      ]
    },
    {
      group: 'Resources',
      items: [
        { text: 'Resources', href: 'tutor-resources.html', role: 'menuitem', icon: 'fa-folder' }
      ]
    },
    {
      group: 'Settings',
      items: [
        { text: 'Site Settings', href: 'tutor-site-settings.html', role: 'menuitem', icon: 'fa-cog' },
        { text: 'Theme Selection', href: 'tutor-theme.html', role: 'menuitem', icon: 'fa-paint-brush' },
        { text: 'Active Devices', href: 'tutor-devices.html', role: 'menuitem', icon: 'fa-display' },
        { text: '2FA', href: 'tutor-2fa.html', role: 'menuitem', icon: 'fa-shield-alt' },
        { text: 'Logout', href: '#', role: 'menuitem', icon: 'fa-right-from-bracket', isButton: true, onclick: 'logout()' }
      ]
    },
    {
      group: 'Support',
      items: [
        { text: 'Help/Support', href: 'tutor-help.html', role: 'menuitem', icon: 'fa-life-ring' }
      ]
    }
  ],
  student: [
    {
      group: 'Learning',
      items: [
        { text: 'Dashboard', href: 'student-dashboard.html', role: 'menuitem', icon: 'fa-house' },
        { text: 'My Courses', href: 'student-courses.html', role: 'menuitem', icon: 'fa-book' },
        { text: 'Explore', href: 'student-explore.html', role: 'menuitem', icon: 'fa-search' },
        { text: 'Certifications', href: 'student-certifications.html', role: 'menuitem', icon: 'fa-certificate' },
        { text: 'Progress Reports', href: 'student-progress.html', role: 'menuitem', icon: 'fa-chart-line' }
      ]
    },
    {
      group: 'Account',
      items: [
        { text: 'Profile', href: 'student-profile.html', role: 'menuitem', icon: 'fa-user' },
        { text: 'Payment History', href: 'student-payments.html', role: 'menuitem', icon: 'fa-wallet' },
        { text: 'Calendar', href: 'student-calendar.html', role: 'menuitem', icon: 'fa-calendar' }
      ]
    },
    {
      group: 'Settings',
      items: [
        { text: 'Site Settings', href: 'student-site-settings.html', role: 'menuitem', icon: 'fa-cog' },
        { text: 'Theme Selection', href: 'student-theme.html', role: 'menuitem', icon: 'fa-paint-brush' },
        { text: 'Active Devices', href: 'student-devices.html', role: 'menuitem', icon: 'fa-display' },
        { text: '2FA', href: 'student-2fa.html', role: 'menuitem', icon: 'fa-shield-alt' },
        { text: 'Logout', href: '#', role: 'menuitem', icon: 'fa-right-from-bracket', isButton: true, onclick: 'logout()' }
      ]
    },
    {
      group: 'Support',
      items: [
        { text: 'Support/Help', href: 'student-help.html', role: 'menuitem', icon: 'fa-life-ring' }
      ]
    }
  ],
  admin: [
    {
      group: 'Management',
      items: [
        { text: 'Dashboard', href: 'admin-dashboard.html', role: 'menuitem', icon: 'fa-house' },
        { text: 'Courses', href: 'admin-courses.html', role: 'menuitem', icon: 'fa-book' },
        { text: 'Users', href: 'admin-users.html', role: 'menuitem', icon: 'fa-users' },
        { text: 'Blog', href: 'admin-blog.html', role: 'menuitem', icon: 'fa-blog' }
      ]
    },
    {
      group: 'Reports',
      items: [
        { text: 'Reports', href: 'admin-reports.html', role: 'menuitem', icon: 'fa-chart-bar' },
        { text: 'Certificates', href: 'admin-certificates.html', role: 'menuitem', icon: 'fa-certificate' },
        { text: 'Payments', href: 'admin-payments.html', role: 'menuitem', icon: 'fa-wallet' }
      ]
    },
    {
      group: 'Settings',
      items: [
        { text: 'Site Settings', href: 'admin-site-settings.html', role: 'menuitem', icon: 'fa-cog' },
        { text: 'Maintenance Mode', href: 'admin-maintenance.html', role: 'menuitem', icon: 'fa-tools' },
        { text: 'Homepage Content', href: 'admin-homepage.html', role: 'menuitem', icon: 'fa-home' },
        { text: 'Theme Selection', href: 'admin-theme.html', role: 'menuitem', icon: 'fa-paint-brush' },
        { text: 'Active Devices', href: 'admin-devices.html', role: 'menuitem', icon: 'fa-display' },
        { text: '2FA', href: 'admin-2fa.html', role: 'menuitem', icon: 'fa-shield-alt' },
        { text: 'Danger Zone', href: 'admin-danger-zone.html', role: 'menuitem', icon: 'fa-exclamation-triangle' },
        { text: 'Logout', href: '#', role: 'menuitem', icon: 'fa-right-from-bracket', isButton: true, onclick: 'logout()' }
      ]
    },
    {
      group: 'Support',
      items: [
        { text: 'Support Tickets', href: 'admin-support.html', role: 'menuitem', icon: 'fa-life-ring' }
      ]
    }
  ]
};

// Render main navbar
function renderMainNav(role) {
  const navList = document.getElementById('nav-link');
  if (!navList) return;

  navList.innerHTML = '';

  mainNavLinks[role].forEach(item => {
    if (item.text === 'Logo (Homepage)') return; // Skip logo (handled in HTML)

    const li = document.createElement('li');
    li.setAttribute('role', item.role);
    if (item.class) li.className = item.class;

    if (item.submenu) {
      li.setAttribute('aria-haspopup', 'true');
      li.setAttribute('aria-expanded', 'false');

      const a = document.createElement('a');
      a.href = item.href;
      a.textContent = item.text;
      li.appendChild(a);

      const dropdown = document.createElement('div');
      dropdown.className = 'dropdown';
      const ul = document.createElement('ul');
      ul.setAttribute('role', 'menu');

      item.submenu.forEach(subItem => {
        const subLi = document.createElement('li');
        subLi.setAttribute('role', subItem.role);
        const subA = document.createElement('a');
        subA.href = subItem.href;
        subA.textContent = subItem.text;
        if (subItem.class) subA.className = subItem.class;
        if (subItem.onclick) subA.setAttribute('onclick', subItem.onclick);
        subLi.appendChild(subA);
        ul.appendChild(subLi);
      });

      dropdown.appendChild(ul);
      li.appendChild(dropdown);
    } else if (item.img && item.class === 'dashboard-profile-picture') {
      const img = document.createElement('img');
      img.src = item.img;
      img.alt = item.alt;
      img.style.cursor = 'pointer';
      img.onclick = () => window.location.href = item.href;
      li.appendChild(img);
    } else {
      const a = document.createElement(item.isButton && !item.href ? 'button' : 'a');
      if (item.href && item.href !== '#') a.href = item.href;
      a.textContent = item.text;
      if (item.class === 'enroll-btn') a.className = 'btn';
      if (item.class === 'toggle') a.innerHTML = '<i class="fa-solid fa-moon"></i>';
      if (item.onclick) a.setAttribute('onclick', item.onclick);
      li.appendChild(a);
    }

    navList.appendChild(li);
  });
}

// Render sidebar
function renderSidebar(role) {
  const sidebar = document.querySelector('.sidebar');
  const logoDiv = sidebar.querySelector('.logo');
  const linksUl = sidebar.querySelector('.links');

  // Skip sidebar rendering for guest
  if (role === 'guest' || !sidebarNavLinks[role].length) {
    sidebar.style.display = 'none';
    document.querySelector('.menu-toggle').style.display = 'none';
    return;
  }

  // Render logo
  const logoItem = mainNavLinks[role].find(item => item.logoText);
  if (logoItem) {
    logoDiv.innerHTML = `
      <a href="${logoItem.href}">
        <img src="${logoItem.img}" alt="${logoItem.alt}">
        <h2>${logoItem.logoText}</h2>
      </a>
    `;
  }

  // Render sidebar links
  linksUl.innerHTML = '';
  sidebarNavLinks[role].forEach(group => {
    const h4 = document.createElement('h4');
    h4.textContent = group.group;
    linksUl.appendChild(h4);

    group.items.forEach(item => {
      const li = document.createElement('li');
      li.setAttribute('role', item.role);
      li.innerHTML = `
        <i class="fa-solid ${item.icon}"></i>
        <a href="${item.href}"${item.onclick ? ` onclick="${item.onclick}"` : ''}>${item.text}</a>
      `;
      linksUl.appendChild(li);
    });

    const hr = document.createElement('hr');
    linksUl.appendChild(hr);
  });
}

// Toggle sidebar on mobile
function toggleSidebar() {
  const menuToggle = document.querySelector('.menu-toggle');
  const sidebar = document.querySelector('.sidebar');
  if (!menuToggle || !sidebar) return;

  menuToggle.addEventListener('click', () => {
    sidebar.classList.toggle('active');
    const isExpanded = sidebar.classList.contains('active');
    menuToggle.setAttribute('aria-expanded', isExpanded);
  });
}

// Export for module usage
export { mainNavLinks, sidebarNavLinks, renderMainNav, renderSidebar, toggleSidebar };















// ============================================================================
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
    // Add icon if present
    if (item.icon) {
      const i = document.createElement('i');
      i.className = `fa-solid ${item.icon}`;
      a.appendChild(i);
    }
    // Add text (for sidebar, text is hidden by CSS unless hovered)
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