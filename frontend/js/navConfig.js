const mainNavLinks = {
    guest: [
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
                {
                    text: 'Web Development',
                    href: 'web-development.html',
                    role: 'menuitem',
                    ariaHaspopup: true,
                    ariaExpanded: false,
                    class: 'dropdown-parent',
                    submenu: [
                        { text: 'HTML', href: 'web-development-html.html' },
                        { text: 'CSS', href: 'web-development-css.html' },
                        { text: 'JavaScript', href: 'web-development-javascript.html' },
                        { text: 'PHP & Laravel', href: 'web-development-php.html' },
                        { text: 'WordPress', href: 'web-development-wordpress.html' },
                        { text: 'Frontend Development', href: 'web-development-frontend.html' },
                        { text: 'Backend Development', href: 'web-development-backend.html' },
                        { text: 'Full-Stack Development', href: 'web-development-fullstack.html' }
                    ]
                },
                {
                    text: 'Mobile App Development',
                    href: 'mobile-apps.html',
                    role: 'menuitem',
                    ariaHaspopup: true,
                    ariaExpanded: false,
                    class: 'dropdown-parent',
                    submenu: [
                        { text: 'React Native', href: 'mobile-react-native.html' },
                        { text: 'Flutter', href: 'mobile-flutter.html' },
                        { text: 'Android Development (Kotlin)', href: 'mobile-android.html' },
                        { text: 'iOS Development (Swift)', href: 'mobile-ios.html' }
                    ]
                },
                {
                    text: 'Data Science & Machine Learning',
                    href: 'data-science.html',
                    role: 'menuitem',
                    ariaHaspopup: true,
                    ariaExpanded: false,
                    class: 'dropdown-parent',
                    submenu: [
                        { text: 'Python for Data Science', href: 'data-python.html' },
                        { text: 'Machine Learning', href: 'data-machine-learning.html' },
                        { text: 'Deep Learning & AI', href: 'data-deep-learning.html' },
                        { text: 'Big Data Analytics', href: 'data-big-data.html' }
                    ]
                },
                {
                    text: 'Cybersecurity & Ethical Hacking',
                    href: 'cybersecurity.html',
                    role: 'menuitem',
                    ariaHaspopup: true,
                    ariaExpanded: false,
                    class: 'dropdown-parent',
                    submenu: [
                        { text: 'Ethical Hacking', href: 'cyber-ethical-hacking.html' },
                        { text: 'Network Security', href: 'cyber-network-security.html' },
                        { text: 'Threat Intelligence', href: 'cyber-threat-intelligence.html' },
                    ]
                },
                {
                    text: 'Cloud Computing & DevOps',
                    href: 'cloud-computing.html',
                    role: 'menuitem',
                    ariaHaspopup: true,
                    ariaExpanded: false,
                    class: 'dropdown-parent',
                    submenu: [
                        { text: 'AWS & Google Cloud', href: 'cloud-aws.html' },
                        { text: 'Docker & Kubernetes', href: 'cloud-docker.html' },
                        { text: 'CI/CD Pipelines', href: 'cloud-ci-cd.html' },
                    ]
                },
                {
                    text: 'Blockchain & Web3',
                    href: 'blockchain.html',
                    role: 'menuitem',
                    ariaHaspopup: true,
                    ariaExpanded: false,
                    class: 'dropdown-parent',
                    submenu: [
                        { text: 'Solidity & Smart Contracts', href: 'blockchain-solidity.html' },
                        { text: 'Decentralized Apps (dApps)', href: 'blockchain-dapps.html' },
                        { text: 'NFT & Crypto Development', href: 'blockchain-nfts.html' }
                    ]
                },
                {
                    text: 'Game Development',
                    href: 'game-development.html',
                    role: 'menuitem',
                    ariaHaspopup: true,
                    ariaExpanded: false,
                    class: 'dropdown-parent',
                    submenu: [
                        { text: 'Unity Game Development', href: 'game-unity.html' },
                        { text: 'Unreal Engine', href: 'game-unreal.html' },
                        { text: 'Mobile Game Development', href: 'game-mobile.html' }
                    ]
                },
                {
                    text: 'Robotics & IoT',
                    href: 'robotics.html',
                    role: 'menuitem',
                    ariaHaspopup: true,
                    ariaExpanded: false,
                    class: 'dropdown-parent',
                    submenu: [
                        { text: 'Arduino & Raspberry Pi', href: 'robotics-arduino.html' },
                        { text: 'Automation & AI in IoT', href: 'robotics-automation.html' },
                        { text: 'Smart Home Devices', href: 'robotics-smart-home.html' }
                    ]
                },
                {
                    text: 'UI/UX Design',
                    href: 'ui-ux.html',
                    role: 'menuitem',
                    ariaHaspopup: true,
                    ariaExpanded: false,
                    class: 'dropdown-parent',
                    submenu: [
                        { text: 'Figma & Adobe XD', href: 'ui-figma.html' },
                        { text: 'Wireframing & Prototyping', href: 'ui-wireframing.html' },
                        { text: 'User Research & UX Strategy', href: 'ui-user-research.html' }
                    ]
                },
                {
                    text: 'Digital Marketing & Tech Business',
                    href: 'digital-marketing.html',
                    role: 'menuitem',
                    ariaHaspopup: true,
                    ariaExpanded: false,
                    class: 'dropdown-parent',
                    submenu: [
                        { text: 'SEO & Content Marketing', href: 'marketing-seo.html' },
                        { text: 'Social Media Growth', href: 'marketing-social-media.html' },
                        { text: 'Tech Startup Strategies', href: 'marketing-tech-startup.html' }
                    ]
                }

                // Add other course submenus as needed
            ]
        },
        { text: 'Admissions', href: 'admissions.html', role: 'menuitem', class: 'nb' },
        { text: 'Contact', href: 'contact.html', role: 'menuitem', class: 'nb' },
        { text: 'Log In', href: 'login-signup.html', role: 'menuitem', class: 'btn', isButton: true }
    ],
    student: [
        { text: 'Dashboard', href: 'student-dashboard.html', role: 'menuitem', class: 'nb' },
        { text: 'My Courses', href: 'student-courses.html', role: 'menuitem', class: 'nb' },
        { text: 'Explore', href: 'courses.html', role: 'menuitem', class: 'nb' },

    ],
    instructor: [
        { text: 'Dashboard', href: 'instructor-dashboard.html', role: 'menuitem' },
        { text: 'Manage Courses', href: 'instructor-courses.html', role: 'menuitem' },
        {
            text: 'Profile Picture',
            href: 'profile.html',
            role: 'menuitem',
            class: 'dashboard-profile-picture dropdown-parent main nb',
            img: 'images/avatars/default.jpg',
            alt: 'Profile Picture',
            submenu: [
                { text: 'Profile', href: 'profile.html', role: 'menuitem' },
                { text: 'Settings', href: 'student-settings.html', role: 'menuitem' },
                { text: 'Logout', href: '#', role: 'menuitem', onclick: 'logout()' }
            ]
        },
        { text: 'Logout', href: '#', role: 'menuitem', class: 'enroll-btn', isButton: true, onclick: 'logout()' }
    ],
    admin: [
        { text: 'Dashboard', href: 'admin-dashboard.html', role: 'menuitem', class: 'nb' },
        { text: 'Manage Users', href: 'admin-users.html', role: 'menuitem', class: 'nb' },
        { text: 'Manage Courses', href: 'admin-courses.html', role: 'menuitem', class: 'nb' },
        {
            text: 'Profile Picture',
            href: 'profile.html',
            role: 'menuitem',
            class: 'dashboard-profile-picture dropdown-parent main nb',
            img: 'images/avatars/default.jpg',
            alt: 'Profile Picture',
            submenu: [
                { text: 'Profile', href: 'profile.html', role: 'menuitem' },
                { text: 'Settings', href: 'student-settings.html', role: 'menuitem' },
                { text: 'Logout', href: '#', role: 'menuitem', onclick: 'logout()' }
            ]
        },
        { text: 'Logout', href: '#', role: 'menuitem', class: 'enroll-btn', isButton: true, onclick: 'logout()' }
    ]
};

const sidebarNavLinks = {
    guest: [],
    tutor: [
        {
            group: 'Account',
            items: [
                { text: 'Dashboard', href: 'tutor-dashboard.html', role: 'menuitem', class: 'nb', icon: 'fa-house' },
                { text: 'My Courses', href: 'tutor-courses.html', role: 'menuitem', class: 'nb', icon: 'fa-book' },
                { text: 'Create Course', href: 'tutor-create.html', role: 'menuitem', class: 'nb', icon: 'fa-plus' },
                { text: 'Earnings', href: 'tutor-earnings.html', role: 'menuitem', class: 'nb', icon: 'fa-wallet' }
            ]
        },
        {
            group: 'Resources',
            items: [
                { text: 'Resources', href: 'tutor-resources.html', role: 'menuitem', class: 'nb', icon: 'fa-folder' }
            ]
        },
        {
            group: 'Settings',
            items: [
                { text: 'Site Settings', href: 'tutor-site-settings.html', role: 'menuitem', class: 'nb', icon: 'fa-cog' },
                { text: 'Theme Selection', href: 'tutor-theme.html', role: 'menuitem', class: 'nb', icon: 'fa-paint-brush' },
                { text: 'Active Devices', href: 'tutor-devices.html', role: 'menuitem', class: 'nb', icon: 'fa-display' },
                { text: '2FA', href: 'tutor-2fa.html', role: 'menuitem', class: 'nb', icon: 'fa-shield-alt' },
                { text: 'Logout', href: '#', role: 'menuitem', class: 'nb', icon: 'fa-right-from-bracket', isButton: true, onclick: 'logout()' }
            ]
        },
        {
            group: 'Support',
            items: [
                { text: 'Help/Support', href: 'tutor-help.html', role: 'menuitem', class: 'nb', icon: 'fa-life-ring' }
            ]
        }
    ],
    student: [
        {
            group: 'Learning',
            items: [
                { text: 'Dashboard', href: 'student-dashboard.html', role: 'menuitem', class: 'nb', icon: 'fa-house' },
                { text: 'My Courses', href: 'student-courses.html', role: 'menuitem', class: 'nb', icon: 'fa-book' },
                { text: 'Explore', href: 'student-explore.html', role: 'menuitem', class: 'nb', icon: 'fa-search' },
                { text: 'Certifications', href: 'student-certifications.html', class: 'nb', role: 'menuitem', icon: 'fa-certificate' },
                { text: 'Progress Reports', href: 'student-progress.html', class: 'nb', role: 'menuitem', icon: 'fa-chart-line' }
            ]
        },
        {
            group: 'Account',
            items: [
                { text: 'Profile', href: 'student-profile.html', class: 'nb', role: 'menuitem', icon: 'fa-user' },
                { text: 'Payment History', href: 'student-payments.html', class: 'nb', role: 'menuitem', icon: 'fa-wallet' },
                { text: 'Calendar', href: 'student-calendar.html', class: 'nb', role: 'menuitem', icon: 'fa-calendar' }
            ]
        },
        {
            group: 'Settings',
            items: [
                { text: 'Site Settings', href: 'student-site-settings.html', class: 'nb', role: 'menuitem', icon: 'fa-cog' },
                { text: 'Theme Selection', href: 'student-theme.html', class: 'nb', role: 'menuitem', icon: 'fa-paint-brush' },
                { text: 'Active Devices', href: 'student-devices.html', class: 'nb', role: 'menuitem', icon: 'fa-display' },
                { text: '2FA', href: 'student-2fa.html', role: 'menuitem', class: 'nb', icon: 'fa-shield-alt' },
                { text: 'Logout', href: '#', role: 'menuitem', class: 'nb', icon: 'fa-right-from-bracket', isButton: true, onclick: 'logout()' }
            ]
        },
        {
            group: 'Support',
            items: [
                { text: 'Support/Help', href: 'student-help.html', class: 'nb', role: 'menuitem', icon: 'fa-life-ring' }
            ]
        }
    ],
    admin: [
        {
            group: 'Management',
            items: [
                { text: 'Dashboard', href: 'admin-dashboard.html', class: 'nb', role: 'menuitem', icon: 'fa-house' },
                { text: 'Courses', href: 'admin-courses.html', class: 'nb', role: 'menuitem', icon: 'fa-book' },
                { text: 'Users', href: 'admin-users.html', class: 'nb', role: 'menuitem', icon: 'fa-users' },
                { text: 'Blog', href: 'admin-blog.html', class: 'nb', role: 'menuitem', icon: 'fa-blog' }
            ]
        },
        {
            group: 'Reports',
            items: [
                { text: 'Reports', href: 'admin-reports.html', class: 'nb', role: 'menuitem', icon: 'fa-chart-bar' },
                { text: 'Certificates', href: 'admin-certificates.html', class: 'nb', role: 'menuitem', icon: 'fa-certificate' },
                { text: 'Payments', href: 'admin-payments.html', class: 'nb', role: 'menuitem', icon: 'fa-wallet' }
            ]
        },
        {
            group: 'Settings',
            items: [
                { text: 'Site Settings', href: 'admin-site-settings.html', class: 'nb', role: 'menuitem', icon: 'fa-cog' },
                { text: 'Maintenance Mode', href: 'admin-maintenance.html', class: 'nb', role: 'menuitem', icon: 'fa-tools' },
                { text: 'Homepage Content', href: 'admin-homepage.html', class: 'nb', role: 'menuitem', icon: 'fa-home' },
                { text: 'Theme Selection', href: 'admin-theme.html', class: 'nb', role: 'menuitem', icon: 'fa-paint-brush' },
                { text: 'Active Devices', href: 'admin-devices.html', class: 'nb', role: 'menuitem', icon: 'fa-display' },
                { text: '2FA', href: 'admin-2fa.html', role: 'menuitem', class: 'nb', icon: 'fa-shield-alt' },
                { text: 'Danger Zone', href: 'admin-danger-zone.html', class: 'nb', role: 'menuitem', icon: 'fa-exclamation-triangle' },
                { text: 'Logout', href: '#', role: 'menuitem', class: 'nb', icon: 'fa-right-from-bracket', isButton: true, onclick: 'logout()' }
            ]
        },
        {
            group: 'Support',
            items: [
                { text: 'Support Tickets', href: 'admin-support.html', class: 'nb', role: 'menuitem', icon: 'fa-life-ring' }
            ]
        }
    ]
};


// Expose to global scope
window.mainNavLinks = mainNavLinks;
window.sidebarNavLinks = sidebarNavLinks;
console.log("navConfig.js loaded:", window.mainNavLinks);