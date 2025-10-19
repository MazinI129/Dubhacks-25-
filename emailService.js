import nodemailer from 'nodemailer';

// In-memory storage for verification codes (use Redis/DynamoDB in production)
const verificationCodes = new Map();

// Configure email transporter
// For development, you can use Gmail, Ethereal, or any SMTP service
// For production, use services like SendGrid, AWS SES, Mailgun, etc.
function createTransporter() {
  // Check if custom SMTP settings are provided
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  // For development/testing - create a test account with Ethereal
  // You can also configure Gmail or other services here
  console.warn('⚠️  No SMTP configuration found. Email verification will not work.');
  console.warn('   Please set SMTP_HOST, SMTP_USER, SMTP_PASS in .env file');
  console.warn('   Example for Gmail:');
  console.warn('   SMTP_HOST=smtp.gmail.com');
  console.warn('   SMTP_PORT=587');
  console.warn('   SMTP_USER=your-email@gmail.com');
  console.warn('   SMTP_PASS=your-app-password');

  return null;
}

const transporter = createTransporter();

// Generate a 6-digit verification code
export function generateVerificationCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Store verification code with expiration (10 minutes)
export function storeVerificationCode(email, code) {
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes
  verificationCodes.set(email.toLowerCase(), { code, expiresAt });

  // Clean up expired codes
  setTimeout(() => {
    const stored = verificationCodes.get(email.toLowerCase());
    if (stored && stored.expiresAt <= Date.now()) {
      verificationCodes.delete(email.toLowerCase());
    }
  }, 10 * 60 * 1000);
}

// Verify the code
export function verifyCode(email, code) {
  const stored = verificationCodes.get(email.toLowerCase());

  if (!stored) {
    return { valid: false, error: 'No verification code found. Please request a new code.' };
  }

  if (Date.now() > stored.expiresAt) {
    verificationCodes.delete(email.toLowerCase());
    return { valid: false, error: 'Verification code expired. Please request a new code.' };
  }

  if (stored.code !== code) {
    return { valid: false, error: 'Invalid verification code.' };
  }

  // Code is valid, remove it so it can't be used again
  verificationCodes.delete(email.toLowerCase());
  return { valid: true };
}

// Send verification email
export async function sendVerificationEmail(email, code, name) {
  if (!transporter) {
    // For development without SMTP - log the code
    console.log(`\n📧 VERIFICATION CODE for ${email}: ${code}\n`);
    return { success: true, message: 'Verification code logged to console (SMTP not configured)' };
  }

  const mailOptions = {
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: email,
    subject: 'Verify Your Email - SnapSyllabus',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .container {
              background-color: #f9f9f9;
              border-radius: 10px;
              padding: 30px;
              border: 1px solid #e0e0e0;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
            }
            .header h1 {
              color: #007bff;
              margin: 0;
            }
            .code-container {
              background-color: white;
              border: 2px dashed #007bff;
              border-radius: 8px;
              padding: 20px;
              text-align: center;
              margin: 30px 0;
            }
            .code {
              font-size: 32px;
              font-weight: bold;
              letter-spacing: 8px;
              color: #007bff;
              font-family: 'Courier New', monospace;
            }
            .info {
              background-color: #fff3cd;
              border-left: 4px solid #ffc107;
              padding: 15px;
              margin: 20px 0;
              border-radius: 4px;
            }
            .footer {
              text-align: center;
              margin-top: 30px;
              color: #666;
              font-size: 14px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>SnapSyllabus</h1>
              <p>Email Verification</p>
            </div>

            <p>Hi ${name || 'there'},</p>

            <p>Thank you for signing up for SnapSyllabus! To complete your registration, please verify your email address using the code below:</p>

            <div class="code-container">
              <div class="code">${code}</div>
            </div>

            <div class="info">
              <strong>⏱️ This code will expire in 10 minutes.</strong>
            </div>

            <p>If you didn't request this verification code, please ignore this email.</p>

            <div class="footer">
              <p>This is an automated email, please do not reply.</p>
              <p>&copy; ${new Date().getFullYear()} SnapSyllabus. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `
Hi ${name || 'there'},

Thank you for signing up for SnapSyllabus!

Your verification code is: ${code}

This code will expire in 10 minutes.

If you didn't request this verification code, please ignore this email.

---
This is an automated email, please do not reply.
© ${new Date().getFullYear()} SnapSyllabus. All rights reserved.
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Verification email sent to ${email}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Error sending verification email:', error);
    throw new Error('Failed to send verification email');
  }
}

// Get time remaining for a code
export function getCodeExpiration(email) {
  const stored = verificationCodes.get(email.toLowerCase());
  if (!stored) return null;

  const remaining = Math.max(0, stored.expiresAt - Date.now());
  return Math.ceil(remaining / 1000); // seconds
}
