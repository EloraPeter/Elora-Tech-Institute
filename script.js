//nav bar functionalities
document.addEventListener("DOMContentLoaded", () => {
  const navbar = document.getElementById("navbar");
  let inactivityTimeout;
  let lastScrollPosition = 0;
  let isScrolling = false;
  // Function to hide the navbar
  const hideNavbar = () => {
    if (!isInOriginalPosition()) {
      navbar.classList.add("hidden");
    }
  };
  // Function to show the navbar
  const showNavbar = () => {
    navbar.classList.remove("hidden");
  };
  // Check if the navbar is in its original position
  const isInOriginalPosition = () => {
    return window.scrollY === 0;
  };
  // Update navbar transparency based on scroll position
  const updateNavbarTransparency = () => {
    if (isInOriginalPosition()) {
      navbar.classList.remove("scrolled"); // Solid color at top
    } else {
      navbar.classList.add("scrolled"); // Semi-transparent when scrolled
    }
  };
  // Event listener for scroll events
  window.addEventListener("scroll", () => {
    showNavbar();
    updateNavbarTransparency(); // Update transparency on scroll
    if (!isScrolling) {
      isScrolling = true;
    }
    clearTimeout(inactivityTimeout);
    inactivityTimeout = setTimeout(() => {
      if (!isScrolling) {
        hideNavbar();
      }
    }, 700);
    lastScrollPosition = window.scrollY;
    setTimeout(() => {
      isScrolling = false;
    }, 100);
  });
  // Event listener for mouse movement or key presses
  document.addEventListener("mousemove", () => {
    showNavbar();
    updateNavbarTransparency(); // Ensure transparency updates
    clearTimeout(inactivityTimeout);
    inactivityTimeout = setTimeout(hideNavbar, 2000);
  });
  document.addEventListener("keydown", () => {
    showNavbar();
    updateNavbarTransparency(); // Ensure transparency updates
    clearTimeout(inactivityTimeout);
    inactivityTimeout = setTimeout(hideNavbar, 2000);
  });
  // Initial setup
  updateNavbarTransparency();
  inactivityTimeout = setTimeout(hideNavbar, 2000);
});



// Dark mode toggle functionality
const toggleDark = document.querySelector("#toggle");
// Toggle dark mode and update UI/localStorage
function updateDarkMode(isDark) {
    document.body.classList.toggle('dark', isDark);
    toggleDark.innerHTML = isDark
        ? '<i class="fa-solid fa-sun"></i>'
        : '<i class="fa-solid fa-moon"></i>';
    localStorage.setItem('darkMode', isDark);
}
// Check saved preference or fallback to system preference
const savedMode = localStorage.getItem('darkMode');
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
updateDarkMode(savedMode === 'true' || (savedMode === null && prefersDark));
// Toggle on click
toggleDark.addEventListener('click', () => updateDarkMode(!document.body.classList.contains('dark')));




// why choose us section
document.addEventListener("DOMContentLoaded", function () {
  const boxes = document.querySelectorAll(".wcu-container .box");
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("show");
        }
      });
    },
    { threshold: 0.3 }
  );

  boxes.forEach((box) => observer.observe(box));
});
