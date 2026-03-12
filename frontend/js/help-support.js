// Wait for DOM to load
document.addEventListener("DOMContentLoaded", () => {
  // Load user role from localStorage or default to 'student'
  const userRole = localStorage.getItem("userRole") || "student";
  if (userRole !== "admin") {
    document.querySelector(".support-tickets").style.display = "none";
  }

  // Toggle FAQs
  document.querySelectorAll(".course-item h4").forEach((header) => {
    header.addEventListener("click", () => {
      const answer = header.nextElementSibling;
      answer.style.display =
        answer.style.display === "block" ? "none" : "block";
    });
  });

  // Search FAQs
  function searchFAQs() {
    const query = document.getElementById("faqSearch").value.toLowerCase();
    document.querySelectorAll(".course-item").forEach((item) => {
      const question = item.querySelector("h4").textContent.toLowerCase();
      const answer = item.querySelector("p").textContent.toLowerCase();
      item.style.display =
        question.includes(query) || answer.includes(query) ? "block" : "none";
    });
  }
  document.getElementById("faqSearch").addEventListener("input", searchFAQs);

  // Submit Contact Form
  // js/frontend.js (partial update for API endpoints)
window.submitContactForm = async function(event) {
  event.preventDefault();
  const form = document.getElementById('contactForm');
  if (!form.checkValidity()) {
    alert('Please fill all required fields');
    return;
  }

  const formData = {
    role: document.getElementById('contactRole').value,
    category: document.getElementById('contactCategory').value,
    subject: document.getElementById('contactSubject').value,
    email: document.getElementById('contactEmail').value,
    message: document.getElementById('contactMessage').value,
    timestamp: new Date().toISOString()
  };

  try {
    const response = await fetch('/api/support/tickets', { // Updated endpoint
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` }, // Add token if using JWT
      body: JSON.stringify(formData)
    });
    const data = await response.json();
    if (response.ok) {
      alert(data.message);
      form.reset();
    } else {
      alert(data.error || 'Error submitting request.');
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Network error. Please check your connection.');
  }
};

window.downloadDoc = async function(id) {
  const docs = {
    '1': 'Student Getting Started Guide',
    '2': 'Tutor Getting Started Guide',
    '3': 'Admin User Manual',
    '4': 'Course Creation Tutorial',
    '5': 'Platform Policies'
  };
  const button = event.target;
  button.disabled = true;
  button.textContent = 'Downloading...';
  try {
    const response = await fetch(`/api/docs/download/${id}`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } // Add token if using JWT
    });
    if (response.ok) {
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${docs[id]}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
      alert(`Downloaded: ${docs[id]}`);
    } else {
      alert('Error downloading document.');
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Network error. Please try again.');
  } finally {
    button.disabled = false;
    button.textContent = 'Download';
  }
};

window.submitFeedback = async function(event) {
  event.preventDefault();
  const rating = document.getElementById('feedbackRating').value;
  const message = document.getElementById('feedbackMessage').value;
  if (!rating) {
    alert('Please select a rating');
    return;
  }
  try {
    const response = await fetch('/api/support/feedback', { // Updated endpoint
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
      body: JSON.stringify({ rating, message })
    });
    const data = await response.json();
    if (response.ok) {
      alert(data.message);
      document.getElementById('feedbackForm').reset();
    }
  } catch (error) {
    alert('Error submitting feedback. Please try again.');
  }
};

// async function loadSupportTickets() {
//   if (localStorage.getItem('userRole') !== 'admin') return;
//   try {
//     const response = await fetch('/api/support/tickets', {
//       headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
//     });
//     const tickets = await response.json();
//     const ticketList = document.querySelector('.support-tickets .course-list');
//     ticketList.innerHTML = '';
//     tickets.forEach(ticket => {
//       const div = document.createElement('div');
//       div.className = 'course-item';
//       div.innerHTML = `
//         <h3>Ticket #${ticket.id}: ${ticket.subject}</h3>
//         <p>Status: ${ticket.status} | Submitted by: ${ticket.role} | 
//         <a href="ticket-details.html?id=${ticket.id}">View Details</a></p>
//       `;
//       ticketList.appendChild(div);
//     });
//   } catch (error) {
//     console.error('Error loading tickets:', error);
//   }
// }
// loadSupportTickets();

async function loadNotifications() {
  try {
    const response = await fetch('/api/notifications', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    const notifications = await response.json();
    const dropdown = document.querySelector('.notification-dropdown');
    dropdown.innerHTML = '';
    notifications.forEach(notif => {
      const p = document.createElement('p');
      p.innerHTML = `<strong>${notif.type}:</strong> ${notif.message}`;
      dropdown.appendChild(p);
    });
  } catch (error) {
    console.error('Error loading notifications:', error);
  }
}
loadNotifications();
});
