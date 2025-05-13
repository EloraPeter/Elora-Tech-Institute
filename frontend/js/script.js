// Why Choose Us Section
document.addEventListener('DOMContentLoaded', () => {
    const boxes = document.querySelectorAll('.wcu-container .box');
    if (boxes.length > 0) {
        console.log(`Found ${boxes.length} WCU boxes`);
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('show');
                        observer.unobserve(entry.target);
                    }
                });
            },
            { threshold: 0.3 }
        );
        boxes.forEach((box) => observer.observe(box));
    } else {
        console.log('No WCU boxes found on this page');
    }

    // Toggle Filter Panel
    const toggleFilter = document.getElementById('toggleFilter');
    const filterPanel = document.getElementById('filterPanel');
    if (toggleFilter && filterPanel) {
        toggleFilter.addEventListener('click', () => {
            filterPanel.classList.toggle('hidden');
        });
    } else {
        console.log('Filter panel elements not found on this page');
    }

    // Search Functionality
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('search-btn');
    const courses = document.querySelectorAll('.course');
    function filterCoursesBySearch() {
        const query = searchInput ? searchInput.value.toLowerCase() : '';
        courses.forEach(course => {
            const title = course.querySelector('h2')?.textContent.toLowerCase() || '';
            const description = course.querySelector('h3')?.textContent.toLowerCase() || '';
            if (title.includes(query) || description.includes(query)) {
                course.classList.remove('hidden');
            } else {
                course.classList.add('hidden');
            }
        });
    }
    if (searchInput && searchBtn) {
        searchInput.addEventListener('input', filterCoursesBySearch);
        searchBtn.addEventListener('click', filterCoursesBySearch);
    } else {
        console.log('Search elements not found on this page');
    }

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
            ].filter(Boolean);
            if (activeFilters.length === 0) {
                course.classList.remove('hidden');
            } else {
                const matches = activeFilters.some(filter => courseFilters.includes(filter));
                if (matches) {
                    course.classList.remove('hidden');
                } else {
                    course.classList.add('hidden');
                }
            }
        });
        filterCoursesBySearch();
    }
    if (filterCheckboxes.length > 0) {
        filterCheckboxes.forEach(checkbox => {
            checkbox.addEventListener('change', filterCourses);
        });
    } else {
        console.log('Filter checkboxes not found on this page');
    }

    // FAQ Accordion
    document.querySelectorAll('.accordion-title').forEach(title => {
        title.addEventListener('click', () => {
            const currentItem = title.parentElement;
            const accordionItems = document.querySelectorAll('.accordion-item');
            accordionItems.forEach(item => {
                if (item !== currentItem) {
                    item.classList.remove('active');
                }
            });
            currentItem.classList.toggle('active');
        });
    });

    // Price styling
    document.querySelectorAll('*').forEach(element => {
        if (element.textContent.toLowerCase().includes('price')) {
            element.classList.add('has-price');
        }
    });
});

// Payment-related functions (only relevant on payment pages)
function validateForm(name, email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!name || name.length < 2) {
        return false;
    }
    if (!email || !emailRegex.test(email)) {
        return false;
    }
    return true;
}

function showLoading() {
    const loadingOverlay = document.getElementById('loadingOverlay');
    if (loadingOverlay) {
        loadingOverlay.classList.remove('hidden');
    }
}

function hideLoading() {
    const loadingOverlay = document.getElementById('loadingOverlay');
    if (loadingOverlay) {
        loadingOverlay.classList.add('hidden');
    }
}

function loadPaystackScript(callback) {
    if (window.PaystackPop) {
        callback();
        return;
    }
    const paystackScript = document.createElement('script');
    paystackScript.src = 'https://js.paystack.co/v1/inline.js';
    paystackScript.onload = callback;
    paystackScript.onerror = () => console.error('Failed to load Paystack script');
    document.body.appendChild(paystackScript);
}

function initiatePayment(name, email) {
    if (!validateForm(name, email)) {
        console.error('Invalid form data');
        return;
    }
    const sanitizedEmail = email.trim().toLowerCase();
    showLoading();
    loadPaystackScript(() => {
        const handler = PaystackPop.setup({
            key: 'pk_live_8eeec6fd3b1806dffc76d1449868b2e07ce6281e',
            email: sanitizedEmail,
            amount: 19000000,
            currency: 'NGN',
            ref: 'ETI-' + Math.floor(Math.random() * 1000000),
            metadata: {
                course: 'Full-Stack Web Development Mastery',
                name: name,
            },
            callback: function (response) {
                hideLoading();
                if (response.status === 'success') {
                    console.log('Payment successful:', response);
                    // Handle success (e.g., redirect or update UI)
                } else {
                    console.error('Payment failed:', response);
                }
            },
            onClose: function () {
                hideLoading();
                console.log('Payment window closed');
            },
        });
        handler.openIframe();
    });
}

// Retry payment button
const retryPayment = document.getElementById('retryPayment');
if (retryPayment) {
    retryPayment.addEventListener('click', () => {
        const paymentError = document.getElementById('paymentError');
        if (paymentError) {
            paymentError.classList.add('hidden');
        }
        initiatePayment(
            document.getElementById('userName')?.value.trim(),
            document.getElementById('userEmail')?.value.trim()
        );
    });
}

// Remove Firebase-related code if not used on tutor dashboard

// // Why Choose Us Section
// document.addEventListener("DOMContentLoaded", function () {
//   const boxes = document.querySelectorAll(".wcu-container .box");
//   if (boxes.length > 0) {
//     console.log(`Found ${boxes.length} WCU boxes`); // Debug
//     const observer = new IntersectionObserver(
//       (entries) => {
//         entries.forEach((entry) => {
//           if (entry.isIntersecting) {
//             entry.target.classList.add("show");
//             observer.unobserve(entry.target); // Stop observing once shown
//           }
//         });
//       },
//       { threshold: 0.3 }
//     );

//     boxes.forEach((box) => observer.observe(box));
//   } else {
//     console.log("No WCU boxes found on this page"); // Debug
//   }
// });

// //webdev page
// // Toggle Filter Panel
// const toggleFilter = document.getElementById('toggleFilter');
// const filterPanel = document.getElementById('filterPanel');
// toggleFilter.addEventListener('click', () => {
//   filterPanel.classList.toggle('hidden');
// });

// // Search Functionality
// const searchInput = document.getElementById('searchInput');
// const searchBtn = document.getElementById('search-btn');
// const courses = document.querySelectorAll('.course');
// function filterCoursesBySearch() {
//   const query = searchInput.value.toLowerCase();
//   courses.forEach(course => {
//     const title = course.querySelector('h2').textContent.toLowerCase();
//     const description = course.querySelector('h3').textContent.toLowerCase();
//     if (title.includes(query) || description.includes(query)) {
//       course.classList.remove('hidden');
//     } else {
//       course.classList.add('hidden');
//     }
//   });
// }
// searchInput.addEventListener('input', filterCoursesBySearch);
// searchBtn.addEventListener('click', filterCoursesBySearch);

// // Filter Functionality
// const filterCheckboxes = document.querySelectorAll('.filter-sub input[type="checkbox"]');
// function filterCourses() {
//   const activeFilters = Array.from(filterCheckboxes)
//     .filter(checkbox => checkbox.checked)
//     .map(checkbox => checkbox.getAttribute('data-filter'));

//   courses.forEach(course => {
//     const courseFilters = [
//       course.getAttribute('data-dur'),
//       course.getAttribute('data-level'),
//       course.getAttribute('data-price'),
//       course.getAttribute('data-avail'),
//       course.getAttribute('data-cat'),
//       course.getAttribute('data-format'),
//       course.getAttribute('data-top'),
//     ];

//     // If no filters are active, show all courses
//     if (activeFilters.length === 0) {
//       course.classList.remove('hidden');
//     } else {
//       // Check if course matches any active filter
//       const matches = activeFilters.some(filter => courseFilters.includes(filter));
//       if (matches) {
//         course.classList.remove('hidden');
//       } else {
//         course.classList.add('hidden');
//       }
//     }
//   });

//   // Apply search filter on top of category filters
//   filterCoursesBySearch();
// }
// filterCheckboxes.forEach(checkbox => {
//   checkbox.addEventListener('change', filterCourses);
// });

// //faq sections
// document.addEventListener("DOMContentLoaded", () => {
//   document.querySelectorAll('.accordion-title').forEach(title => {
//     title.addEventListener('click', () => {
//       const currentItem = title.parentElement; // The clicked accordion item
//       const accordionItems = document.querySelectorAll('.accordion-item'); // All items

//       // Close all items except the clicked one
//       accordionItems.forEach(item => {
//         if (item !== currentItem) {
//           item.classList.remove('active');
//         }
//       });

//       // Toggle the clicked item (open if closed, close if open)
//       currentItem.classList.toggle('active');
//     });
//   });
// });

// // // FAQ Accordion
// // const accordionItems = document.querySelectorAll(".accordion-item");
// // const accordionToggle = document.querySelector(".accordion-toggle");

// // accordionItems.forEach(item => {
// //     const title = item.querySelector(".accordion-title");
// //     title.addEventListener("click", () => {
// //         const isActive = item.classList.contains("active");
// //         accordionItems.forEach(i => {
// //             i.classList.remove("active");
// //             i.querySelector(".accordion-title").setAttribute("aria-expanded", false);
// //         });
// //         if (!isActive) {
// //             item.classList.add("active");
// //             title.setAttribute("aria-expanded", true);
// //         }
// //     });
// // });

// // accordionToggle.addEventListener("click", () => {
// //     const allActive = Array.from(accordionItems).every(item => item.classList.contains("active"));
// //     accordionItems.forEach(item => {
// //         const title = item.querySelector(".accordion-title");
// //         if (allActive) {
// //             item.classList.remove("active");
// //             title.setAttribute("aria-expanded", false);
// //         } else {
// //             item.classList.add("active");
// //             title.setAttribute("aria-expanded", true);
// //         }
// //     });
// //     accordionToggle.textContent = allActive ? "Expand All" : "Collapse All";
// // });

// //price styling for uniformity
// document.querySelectorAll('*').forEach(element => {
//   if (element.textContent.toLowerCase().includes('price')) {
//     element.classList.add('has-price');
//   }
// });

// function handleRegisterClick() {
//   e.preventDefault();

//   // Check if user is logged in (example: using localStorage)
//   const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';

//   if (isLoggedIn) {
//       window.location.href = 'pay.html';
//   } else {
//       window.location.href = 'login-signup.html';
//   }
// }

// //payment gateway
// //Full-Stack Web Development Mastery course
// // Handle form submission and initiate payment
// function validateForm(name, email) {
//   const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

//   if (!name || name.length < 2) {
//     alert('Please enter a valid name (at least 2 characters).');
//     return false;
//   }

//   if (!email || !emailRegex.test(email)) {
//     alert('Please enter a valid email address (e.g., example@domain.com).');
//     return false;
//   }

//   return true;
// }

// // progress
// function updateProgressTracker(step) {
//   document.querySelectorAll('.step').forEach(s => s.classList.remove('active'));
//   document.querySelector(`.step[data-step="${step}"]`).classList.add('active');
// }

// // In the form submission handler:
// // document.getElementById('paymentDetailsForm')?.addEventListener('submit', (e) => {
// //   e.preventDefault();
// //   const name = document.getElementById('userName').value.trim();
// //   const email = document.getElementById('userEmail').value.trim();
// //   console.log('Form Submission - Name:', name, 'Email:', email);
// //   if (validateForm(name, email)) {
// //     updateProgressTracker(2);
// //     initiatePayment(name, email);
// //   }
// // });

// // Show/hide loading state
// function showLoading() {
//   document.getElementById('loadingOverlay').classList.remove('hidden');
// }

// function hideLoading() {
//   document.getElementById('loadingOverlay').classList.add('hidden');
// }

// // Ensure Paystack script is loaded before initiating payment
// function loadPaystackScript(callback) {
//   if (window.PaystackPop) {
//     callback();
//     return;
//   }
//   const paystackScript = document.createElement('script');
//   paystackScript.src = 'https://js.paystack.co/v1/inline.js';
//   paystackScript.onload = callback;
//   paystackScript.onerror = () => alert('Failed to load payment gateway. Please try again.');
//   document.body.appendChild(paystackScript);
// }

// function initiatePayment(name, email) {
//   console.log('Email being sent to Paystack:', email)
//   if (!name || !email) {
//     alert('Please fill in both name and email fields.');
//     return;
//   }
//   const sanitizedEmail = email.trim().toLowerCase();
//   console.log('Sanitized Email:', sanitizedEmail); // Debug
//   if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(sanitizedEmail)) {
//     alert('Invalid email format detected. Please check your email.');
//     return;
//   }
//   showLoading();
//   loadPaystackScript(() => {
//     const handler = PaystackPop.setup({
//       key: 'pk_live_8eeec6fd3b1806dffc76d1449868b2e07ce6281e', // Replace with your Paystack public key
//       email: sanitizedEmail,
//       amount: 19000000, // Amount in kobo (₦190,000 = 190,000,00 kobo)
//       currency: 'NGN',
//       ref: 'ETI-' + Math.floor(Math.random() * 1000000), // Unique transaction reference
//       metadata: {
//         course: 'Full-Stack Web Development Mastery',
//         name: name,
//       },
//       callback: function (response) {
//         hideLoading();
//         // Payment successful, handle post-payment logic
//         if (response.status === 'success') {
//           updateProgressTracker(3);
//           alert('Payment successful! Check your email for course details.');
//           sendPaymentConfirmation(response.reference); // Call Firebase function
//           window.location.href = '/success.html'; // Redirect to success page
//         } else {
//           alert('Payment failed. Please try again.');
//         }
//       },
//       onClose: function () {
//         hideLoading();
//         alert('Payment window closed.');
//       },
//     });
//     handler.openIframe(); // Open Paystack payment popup
//   });
// }

// // Retry button functionality
// document.getElementById('retryPayment')?.addEventListener('click', () => {
//   document.getElementById('paymentError').classList.add('hidden');
//   initiatePayment(
//     document.getElementById('userName').value.trim(),
//     document.getElementById('userEmail').value.trim()
//   );
// });

// async function sendPaymentConfirmation(reference, email) {
//   try {
//     const sendConfirmation = firebase.functions().httpsCallable('sendPaymentConfirmation');
//     const result = await sendConfirmation({ reference, email });
//     console.log(result.data.message);
//   } catch (error) {
//     console.error('Error sending confirmation:', error);
//     alert('Failed to send confirmation email. Contact support.');
//   }
// }

// // Initialize Firebase in your script
// firebase.initializeApp({
//   apiKey: "your-api-key",
//   authDomain: "your-auth-domain",
//   projectId: "elora-tech-institute",
//   storageBucket: "your-storage-bucket",
//   messagingSenderId: "353331632423",
//   appId: "1:353331632423:web:932e2ebf5d00123ce2b102"
// });
