document.addEventListener("DOMContentLoaded", () => {
  const navbar = document.getElementById("navbar");
  const navLink = document.querySelector("#nav-link");
  const toggleButton = document.querySelector(".menu-toggle");

  // Debugging: Verify core elements
  if (!navbar) console.error("Navbar not found");
  if (!navLink) console.error("Nav-link not found");
  if (!toggleButton) console.error("Menu toggle button not found");

  let inactivityTimeout;
  let isInteracting = false;
  let isAnimating = false;

  // Throttle function to limit event frequency
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

  // Function to hide the navbar
  const hideNavbar = () => {
    if (window.scrollY > 0 && !isInteracting && !isAnimating) {
      isAnimating = true;
      navbar.classList.add("hidden");
      console.log("Navbar hidden");
      setTimeout(() => {
        isAnimating = false;
      }, 500);
    }
  };

  // Function to show the navbar
  const showNavbar = () => {
    if (!navbar.classList.contains("hidden")) return;
    isAnimating = true;
    navbar.classList.remove("hidden");
    updateNavbarTransparency();
    console.log("Navbar shown");
    setTimeout(() => {
      isAnimating = false;
    }, 500);
  };

  // Update navbar transparency based on scroll position
  const updateNavbarTransparency = () => {
    if (window.scrollY === 0) {
      navbar.classList.remove("scrolled");
    } else {
      navbar.classList.add("scrolled");
    }
  };

  // Throttled scroll handler
  const handleScroll = throttle(() => {
    showNavbar();
    clearTimeout(inactivityTimeout);
    inactivityTimeout = setTimeout(hideNavbar, 2000);
  }, 200);

  // Throttled interaction handler
  const handleInteraction = throttle(() => {
    showNavbar();
    clearTimeout(inactivityTimeout);
    inactivityTimeout = setTimeout(hideNavbar, 4000);
  }, 200);

  // Event listeners for navbar visibility
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

  // Prevent hiding on mobile devices
  if (/Mobi|Android/i.test(navigator.userAgent)) {
    showNavbar();
    clearTimeout(inactivityTimeout);
    window.removeEventListener("scroll", handleScroll);
    console.log("Mobile device detected: Navbar always visible");
  }

  // Initial setup
  updateNavbarTransparency();

  // Menu Toggle for Mobile
  if (toggleButton && navLink) {
    toggleButton.addEventListener("click", () => {
      navLink.classList.toggle("active");
      const isExpanded = navLink.classList.contains("active");
      toggleButton.setAttribute("aria-expanded", isExpanded);
      toggleButton.querySelector("i").classList.toggle("fa-bars");
      toggleButton.querySelector("i").classList.toggle("fa-times");
      // Reset dropdown states when closing menu
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
      console.log("Menu toggled:", isExpanded ? "Open" : "Closed");
    });
  }

  // Dropdown Toggle for Main Dropdown (Courses)
  document.querySelectorAll(".dropdown-parent.main").forEach((parent) => {
    const link = parent.querySelector("a");
    if (link) {
      link.addEventListener("click", (e) => {
        if (window.innerWidth <= 768) {
          e.preventDefault();
          console.log("Main dropdown clicked:", link.textContent);
          navLink.classList.add("slide-left");
          const dropdown1 = parent.querySelector(".dropdown1");
          if (dropdown1) {
            dropdown1.classList.add("active");
            parent.classList.add("active");
            parent.setAttribute("aria-expanded", "true");
            // Force reflow
            dropdown1.offsetHeight;
            console.log("Dropdown1 state:", {
              hasActive: dropdown1.classList.contains("active"),
              display: getComputedStyle(dropdown1).display,
              transform: getComputedStyle(dropdown1).transform
            });
            addBackButton(dropdown1, () => {
              navLink.classList.remove("slide-left");
              dropdown1.classList.remove("active");
              parent.classList.remove("active");
              parent.setAttribute("aria-expanded", "false");
              console.log("Back to main menu");
            });
          } else {
            console.error("Dropdown1 not found for", parent);
          }
        }
      });
    } else {
      console.error("Link not found in .dropdown-parent.main", parent);
    }
  });

  // Dropdown Toggle for Sub-Dropdowns (e.g., Web Development)
  document.querySelectorAll(".dropdown1 .dropdown-parent").forEach((subParent) => {
    const link = subParent.querySelector("a");
    if (link) {
      link.addEventListener("click", (e) => {
        if (window.innerWidth <= 768) {
          if (link.querySelector("i.fa-chevron-down")) {
            e.preventDefault();
            console.log("Sub-dropdown clicked:", link.textContent);
            const dropdown1 = subParent.closest(".dropdown1");
            const dropdown2 = subParent.querySelector(".dropdown2");
            if (dropdown1 && dropdown2) {
              dropdown1.classList.remove("active");
              dropdown2.classList.add("active");
              subParent.classList.add("active");
              subParent.setAttribute("aria-expanded", "true");
              // Force reflow
              dropdown2.offsetHeight;
              console.log("Dropdown2 state:", {
                hasActive: dropdown2.classList.contains("active"),
                display: getComputedStyle(dropdown2).display,
                transform: getComputedStyle(dropdown2).transform
              });
              addBackButton(dropdown2, () => {
                dropdown1.classList.add("active");
                dropdown2.classList.remove("active");
                subParent.classList.remove("active");
                subParent.setAttribute("aria-expanded", "false");
                console.log("Back to dropdown1");
              });
            } else {
              console.error("Dropdown1 or Dropdown2 not found for", subParent);
            }
          }
        }
      });
    } else {
      console.error("Link not found in .dropdown1 .dropdown-parent", subParent);
    }
  });

  // Navigate and Close Menu on Non-Dropdown Links
  document.querySelectorAll("#nav-link > li:not(.dropdown-parent) a, .dropdown-sub li a").forEach((link) => {
    link.addEventListener("click", () => {
      if (window.innerWidth <= 768) {
        console.log("Non-dropdown link clicked:", link.textContent);
        navLink.classList.remove("active");
        navLink.classList.remove("slide-left");
        document.querySelectorAll(".dropdown-parent").forEach((parent) => {
          parent.classList.remove("active");
          parent.setAttribute("aria-expanded", "false");
        });
        document.querySelectorAll(".dropdown1, .dropdown2").forEach((dropdown) => {
          dropdown.classList.remove("active");
        });
        toggleButton.setAttribute("aria-expanded", "false");
        toggleButton.querySelector("i").classList.add("fa-bars");
        toggleButton.querySelector("i").classList.remove("fa-times");
      }
    });
  });

  // Function to add back button dynamically
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
    console.log("Back button added to", dropdown);
  }

  // Dark mode toggle functionality
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
  } else {
    console.warn("Dark mode toggle not found");
  }
});