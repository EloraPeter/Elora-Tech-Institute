document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const name = urlParams.get('name');
    const email = urlParams.get('email');
    const courseId = urlParams.get('course_id');
    const userId = urlParams.get('user_id');
    const price = urlParams.get('price');
  
    if (name) document.getElementById('userName').value = decodeURIComponent(name);
    if (email) document.getElementById('userEmail').value = decodeURIComponent(email);
    if (courseId) document.getElementById('courseId').value = courseId;
    if (userId) document.getElementById('userId').value = userId;
    if (price) document.getElementById('coursePrice').value = price;
  });
  
  document.getElementById('paymentDetailsForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const userName = document.getElementById('userName');
    const userEmail = document.getElementById('userEmail');
    const courseId = document.getElementById('courseId').value;
    const userId = document.getElementById('userId').value;
    const amount = document.getElementById('coursePrice').value;
  
    // Client-side validation
    if (!userName.value.match(/^[A-Za-z\s]{2,50}$/)) {
      document.getElementById('paymentError').classList.remove('hidden');
      document.getElementById('paymentError').querySelector('p').textContent =
        'Name must be 2-50 characters, letters and spaces only';
      return;
    }
    if (!userEmail.value.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      document.getElementById('paymentError').classList.remove('hidden');
      document.getElementById('paymentError').querySelector('p').textContent = 'Invalid email format';
      return;
    }
    if (!amount || isNaN(amount) || amount <= 0) {
      document.getElementById('paymentError').classList.remove('hidden');
      document.getElementById('paymentError').querySelector('p').textContent = 'Invalid course price';
      return;
    }
  
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        window.location.href = `login-signup.html?redirect=pay.html&course_id=${courseId}&price=${amount}`;
        return;
      }
  
      const res = await fetch('http://localhost:3000/api/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          user_id: userId,
          course_id: courseId,
          amount: parseInt(amount),
          email: userEmail.value,
        }),
      });
  
      const data = await res.json();
      if (res.ok) {
        window.location.href = data.payment_url;
      } else {
        document.getElementById('paymentError').classList.remove('hidden');
        document.getElementById('paymentError').querySelector('p').textContent =
          data.error || 'Payment initiation failed';
      }
    } catch (err) {
      document.getElementById('paymentError').classList.remove('hidden');
      document.getElementById('paymentError').querySelector('p').textContent = 'Network error. Please try again.';
    }
  });