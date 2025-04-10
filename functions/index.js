const functions = require('firebase-functions');
const admin = require('firebase-admin');
const nodemailer = require('nodemailer');
const axios = require('axios');

admin.initializeApp();

// Configure Nodemailer (use your email service, e.g., Gmail)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'florenceonyi09@gmail.com', // Your email
    pass: 'your-app-password', // Use an App Password if using Gmail
  },
});

// Verify payment and send email
exports.sendPaymentConfirmation = functions.https.onCall(async (data, context) => {
  const { reference } = data;

  // Verify payment with Paystack
  const paystackResponse = await axios.get(
    `https://api.paystack.co/transaction/verify/${reference}`,
    {
      headers: {
        Authorization: 'Bearer sk_test_your_paystack_secret_key', // Replace with your Paystack secret key
      },
    }
  );

  if (paystackResponse.data.status && paystackResponse.data.data.status === 'success') {
    const { email, metadata } = paystackResponse.data.data;
    const { course, name } = metadata;

    // Email content
    const subject = `Payment Confirmation - Full-Stack Web Development Mastery`;
    const message = `
      Welcome to Elora Tech Institute, ${name}!,\n\n
      Woohoo! You’re one step closer to mastering ${course} with Elora Tech Institute!\n\n
      📌 Course: ${course}\n
      📜 Receipt: Transaction ID ${reference}\n
      🔗 Google Classroom: https://classroom.google.com/c/your-class-code\n
      🔗 Google Meet: https://meet.google.com/your-meet-link\n
      🔗 WhatsApp Group: https://chat.whatsapp.com/your-whatsapp-link\n
      📅 Week 1 Kickoff: March 14, 2025\n
      📚 Week 1 Resources: [Insert Link]\n\n
      Got questions? Just hit reply—we’re here to help.\n\n
      Can’t wait to see you in class!\n
      Elora Tech Team
    `;

    // Send email
    await transporter.sendMail({
      from: '"Elora Tech Institute" <florenceonyi09@gmail.com>',
      to: email,
      subject: subject,
      text: message,
    });

    return { success: true, message: 'Email sent successfully!' };
  } else {
    throw new functions.https.HttpsError('invalid-argument', 'Payment verification failed.');
  }
});