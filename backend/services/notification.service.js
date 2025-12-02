const nodemailer = require('nodemailer');

// Mock transporter for development (prints to console instead of sending)
const mockSendEmail = async (to, subject, text) => {
  console.log("========================================");
  console.log(`[MOCK EMAIL] To: ${to}`);
  console.log(`[MOCK EMAIL] Subject: ${subject}`);
  console.log(`[MOCK EMAIL] Body: ${text}`);
  console.log("========================================");
  return true;
};

// --- PUBLIC FUNCTIONS ---

exports.sendOTP = async (email, mobile, otp) => {
  const message = `Your verification code for Event Booking is: ${otp}. Valid for 10 minutes.`;
  
  // 1. Log to console (Simulated Email)
  await mockSendEmail(email, 'Verify Your Account', message);

  // 2. Log to console (Simulated SMS)
  console.log(`[MOCK SMS] Sending to ${mobile}: ${message}`);
};

exports.sendBookingConfirmation = async (email, mobile, bookingDetails) => {
  const message = `
    Booking Confirmed!
    Movie: ${bookingDetails.movie}
    Time: ${new Date(bookingDetails.time).toLocaleString()}
    Seats: ${bookingDetails.seats}
    Booking ID: #${bookingDetails.id}
  `;

  await mockSendEmail(email, 'Booking Confirmed!', message);
  console.log(`[MOCK SMS] Sending to ${mobile}: ${message}`);
};