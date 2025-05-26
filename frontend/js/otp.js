    const inputs = document.querySelectorAll('.otp-digit');
    inputs.forEach((input, index) => {
      input.addEventListener('input', (e) => {
        if (e.target.value.length === 1 && index < inputs.length - 1) {
          inputs[index + 1].focus();
        }
        updateOtpValue();
      });
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Backspace' && !e.target.value && index > 0) {
          inputs[index - 1].focus();
        }
      });
    });

    function updateOtpValue() {
      const otp = Array.from(inputs).map(input => input.value).join('');
      console.log('Concatenated OTP:', otp); // Debug OTP value
      document.getElementById('otp').value = otp;
      return otp.length === 6;
    }

    // Store email from URL query parameter
    const urlParams = new URLSearchParams(window.location.search);
    const email = urlParams.get('email');
    if (email) {
      sessionStorage.setItem('resetEmail', email);
      document.getElementById('email').value = email; // Set hidden email field
    } else {
      alert('Email not found. Please restart the password reset process.');
      window.location.href = '/forgot-password';
    }

    document.getElementById('otp-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!updateOtpValue()) {
        alert('Please enter a 6-digit OTP');
        return;
      }
      const form = e.target;
      const formData = new FormData(form);
      // Log form data for debugging
      for (let [key, value] of formData.entries()) {
        console.log(`FormData ${key}: ${value}`);
      }
      try {
        const response = await fetch(form.action, {
          method: form.method,
          body: formData,
          headers: { 'Accept': 'application/json' }
        });
        const result = await response.json();
        if (result.redirect) {
          window.location.href = result.redirect;
        } else {
          alert(result.message);
        }
      } catch (err) {
        console.error('Submission error:', err);
        alert('Network error. Please try again.');
      }
    });

    document.getElementById('resend-otp').addEventListener('click', async () => {
      const email = sessionStorage.getItem('resetEmail');
      if (!email) {
        alert('Email not found. Please restart the password reset process.');
        window.location.href = '/forgot-password';
        return;
      }
      try {
        const response = await fetch('/api/resend-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify({ email })
        });
        const result = await response.json();
        if (result.redirect) {
          window.location.href = result.redirect;
        } else {
          alert(result.message);
        }
      } catch (err) {
        console.error('Resend OTP error:', err);
        alert('Network error. Please try again.');
      }
    });
