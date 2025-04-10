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





// Menu Toggle for Mobile
document.querySelector('.menu-toggle').addEventListener('click', () => {
  const navLink = document.querySelector('#nav-link');
  const toggleButton = document.querySelector('.menu-toggle');
  navLink.classList.toggle('active');
  const isExpanded = navLink.classList.contains('active');
  toggleButton.setAttribute('aria-expanded', isExpanded);
  toggleButton.querySelector('i').classList.toggle('fa-bars');
  toggleButton.querySelector('i').classList.toggle('fa-times');
});

// Dropdown Toggle for Mobile
document.querySelectorAll('.dropdown-parent').forEach(parent => {
  parent.addEventListener('click', (e) => {
    if (window.innerWidth <= 768) {
      e.preventDefault();
      parent.classList.toggle('active');
      const isExpanded = parent.classList.contains('active');
      parent.setAttribute('aria-expanded', isExpanded);
    }
  });
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



//webdev page
// Toggle Filter Panel
const toggleFilter = document.getElementById('toggleFilter');
const filterPanel = document.getElementById('filterPanel');
toggleFilter.addEventListener('click', () => {
  filterPanel.classList.toggle('hidden');
});





// Search Functionality
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('search-btn');
const courses = document.querySelectorAll('.course');
function filterCoursesBySearch() {
  const query = searchInput.value.toLowerCase();
  courses.forEach(course => {
    const title = course.querySelector('h2').textContent.toLowerCase();
    const description = course.querySelector('h3').textContent.toLowerCase();
    if (title.includes(query) || description.includes(query)) {
      course.classList.remove('hidden');
    } else {
      course.classList.add('hidden');
    }
  });
}
searchInput.addEventListener('input', filterCoursesBySearch);
searchBtn.addEventListener('click', filterCoursesBySearch);





// Filter Functionality
const filterCheckboxes = document.querySelectorAll('.filter-sub input[type="checkbox"]');
function filterCourses() {
  const activeFilters = Array.from(filterCheckboxes)
    .filter(checkbox => checkbox.checked)
    .map(checkbox => checkbox.getAttribute('data-filter'));

  courses.forEach(course => {
    const courseFilters = [
      course.getAttribute('data-dur'),
      course.getAttribute('data-level'),
      course.getAttribute('data-price'),
      course.getAttribute('data-avail'),
      course.getAttribute('data-cat'),
      course.getAttribute('data-format'),
      course.getAttribute('data-top'),
    ];

    // If no filters are active, show all courses
    if (activeFilters.length === 0) {
      course.classList.remove('hidden');
    } else {
      // Check if course matches any active filter
      const matches = activeFilters.some(filter => courseFilters.includes(filter));
      if (matches) {
        course.classList.remove('hidden');
      } else {
        course.classList.add('hidden');
      }
    }
  });

  // Apply search filter on top of category filters
  filterCoursesBySearch();
}
filterCheckboxes.forEach(checkbox => {
  checkbox.addEventListener('change', filterCourses);
});





//faq sections
document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll('.accordion-title').forEach(title => {
    title.addEventListener('click', () => {
      const currentItem = title.parentElement; // The clicked accordion item
      const accordionItems = document.querySelectorAll('.accordion-item'); // All items

      // Close all items except the clicked one
      accordionItems.forEach(item => {
        if (item !== currentItem) {
          item.classList.remove('active');
        }
      });

      // Toggle the clicked item (open if closed, close if open)
      currentItem.classList.toggle('active');
    });
  });
});





//price styling for uniformity
document.querySelectorAll('*').forEach(element => {
  if (element.textContent.toLowerCase().includes('price')) {
    element.classList.add('has-price');
  }
});





//payment gateway
//Full-Stack Web Development Mastery course
function initiatePayment() {
  const handler = PaystackPop.setup({
    key: 'pk_test_your_paystack_public_key', // Replace with your Paystack public key
    email: 'user@example.com', // Replace with the user's email (dynamically fetch this)
    amount: 19000000, // Amount in kobo (₦190,000 = 190,000,00 kobo)
    currency: 'NGN',
    ref: 'ETI-' + Math.floor(Math.random() * 1000000), // Unique transaction reference
    metadata: {
      course: 'Full-Stack Web Development Mastery',
      name: 'User Name', // Replace with user's name (dynamically fetch this)
    },
    callback: function (response) {
      // Payment successful, handle post-payment logic
      if (response.status === 'success') {
        alert('Payment successful! Check your email for course details.');
        sendPaymentConfirmation(response.reference); // Call Firebase function
        window.location.href = '/success.html'; // Redirect to success page
      } else {
        alert('Payment failed. Please try again.');
      }
    },
    onClose: function () {
      alert('Payment window closed.');
    },
  });
  handler.openIframe(); // Open Paystack payment popup
}

// Load Paystack script dynamically
const paystackScript = document.createElement('script');
paystackScript.src = 'https://js.paystack.co/v1/inline.js';
document.body.appendChild(paystackScript);





async function sendPaymentConfirmation(reference) {
  try {
    const sendConfirmation = firebase.functions().httpsCallable('sendPaymentConfirmation');
    const result = await sendConfirmation({ reference });
    console.log(result.data.message);
  } catch (error) {
    console.error('Error sending confirmation:', error);
  }
}

// Initialize Firebase in your script
firebase.initializeApp({
  apiKey: "your-api-key",
  authDomain: "your-auth-domain",
  projectId: "your-project-id",
  storageBucket: "your-storage-bucket",
  messagingSenderId: "your-messaging-sender-id",
  appId: "your-app-id"
});