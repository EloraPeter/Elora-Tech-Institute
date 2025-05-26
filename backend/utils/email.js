const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const sendResetEmail = async (to, token, otp, expiresAt) => {
  const resetLink = `http://localhost:3000/resetpass.html?token=${token}`;
  const formattedExpiresAt = expiresAt.toLocaleString('en-US', {
    hour: 'numeric',
    minute: 'numeric',
    hour12: true,
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject: 'ETI Password Reset Request',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f4f4f4;">
        <div style="background-color: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <h2 style="color: #007bff; text-align: center;">ETI Password Reset</h2>
          <p style="color: #333;">You requested a password reset for your ETI account. You can use either of the following methods to reset your password. Both options expire at <strong>${formattedExpiresAt}</strong>.</p>
          <h3 style="color: #333;">Option 1: Reset Link</h3>
          <p style="color: #333;">Click the button below to reset your password:</p>
          <a href="${resetLink}" style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: #ffffff; text-decoration: none; border-radius: 4px; margin: 10px 0;">Reset Password</a>
          <h3 style="color: #333;">Option 2: OTP</h3>
          <p style="color: #333;">Use the following 6-digit OTP to reset your password:</p>
          <p style="font-size: 24px; font-weight: bold; color: #007bff; text-align: center; letter-spacing: 5px;">${otp}</p>
          <p style="color: #666; font-size: 12px; text-align: center;">This link and OTP will expire at ${formattedExpiresAt}. If you did not request this, please ignore this email.</p>
        </div>
      </div>
    `
  };

  await transporter.sendMail(mailOptions);
};

module.exports = { sendResetEmail };