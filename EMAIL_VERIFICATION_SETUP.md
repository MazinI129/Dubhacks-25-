# Email Verification Setup Guide

This guide explains how to configure email verification for SnapSyllabus.

## Overview

Email verification has been added to the signup flow to ensure users own the email addresses they register with. When users sign up, they must:

1. Enter their name and email
2. Click "Send Verification Code"
3. Check their email for a 6-digit code
4. Enter the code in the app
5. Complete signup with their password

## Features

- **6-digit verification codes** sent via email
- **10-minute expiration** for security
- **Resend functionality** with 60-second cooldown
- **Beautiful email templates** (HTML + plain text)
- **Real-time validation** with visual feedback
- **Paste support** for verification codes
- **Auto-focus** on input fields for better UX

## SMTP Configuration

### Option 1: Gmail (Recommended for Development)

1. **Enable 2-Factor Authentication** on your Google account
   - Go to https://myaccount.google.com/security
   - Enable 2-Step Verification

2. **Generate an App Password**
   - Visit https://myaccount.google.com/apppasswords
   - Select "Mail" and your device
   - Copy the 16-character password

3. **Update .env file**
   ```env
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-16-char-app-password
   SMTP_FROM=your-email@gmail.com
   ```

### Option 2: SendGrid (Recommended for Production)

1. **Create a SendGrid account** at https://sendgrid.com
2. **Generate an API key**
3. **Update .env file**
   ```env
   SMTP_HOST=smtp.sendgrid.net
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=apikey
   SMTP_PASS=your-sendgrid-api-key
   SMTP_FROM=verified-sender@yourdomain.com
   ```

### Option 3: AWS SES (Recommended for Production)

1. **Set up AWS SES** in your AWS account
2. **Verify your domain or email**
3. **Get SMTP credentials**
4. **Update .env file**
   ```env
   SMTP_HOST=email-smtp.us-east-1.amazonaws.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=your-ses-smtp-username
   SMTP_PASS=your-ses-smtp-password
   SMTP_FROM=verified@yourdomain.com
   ```

### Option 4: Other Providers

- **Mailgun**: smtp.mailgun.org (port 587)
- **Outlook**: smtp-mail.outlook.com (port 587)
- **Yahoo**: smtp.mail.yahoo.com (port 587)

## Testing Without SMTP

If you don't configure SMTP, the verification codes will be **logged to the console** for development/testing:

```
📧 VERIFICATION CODE for user@example.com: 123456
```

Simply check your server console output to get the code.

## Password Requirements

The following password requirements are enforced:

- ✓ At least 8 characters
- ✓ One uppercase letter (A-Z)
- ✓ One lowercase letter (a-z)
- ✓ One number (0-9)
- ✓ One special character (!@#$%^&*()_+-=[]{};':"\\|,.<>/?)

## Email Validation

Email addresses must:
- Be in valid format (user@domain.com)
- Not already be registered in the system

## Security Features

1. **Verification codes expire after 10 minutes**
2. **Codes can only be used once**
3. **Email ownership verified before account creation**
4. **Duplicate email prevention**
5. **Rate limiting via 60-second resend cooldown**

## API Endpoints

### Send Verification Code
```
POST /auth/send-verification
Body: { email: string, name: string }
```

### Verify Code
```
POST /auth/verify-code
Body: { email: string, code: string }
```

### Signup (requires verified email)
```
POST /auth/signup
Body: { email: string, password: string, name: string, verificationCode: string }
```

## Troubleshooting

### Emails not sending?

1. **Check .env configuration** - ensure all SMTP variables are set
2. **Gmail users**: Make sure you're using an App Password, not your regular password
3. **Check spam folder** - verification emails might be filtered
4. **Console logs** - if SMTP isn't configured, codes will be logged to console

### "Invalid verification code" error?

1. **Check expiration** - codes expire after 10 minutes
2. **Request new code** - click "Resend Code"
3. **Check for typos** - ensure you entered the code correctly

### "Email already registered" error?

- This email is already in use. Try logging in instead, or use a different email.

## Production Considerations

For production deployment:

1. **Use a professional email service** (SendGrid, AWS SES, Mailgun)
2. **Set up proper DNS records** (SPF, DKIM, DMARC)
3. **Use Redis or DynamoDB** instead of in-memory storage for verification codes
4. **Implement rate limiting** to prevent abuse
5. **Add email templates** for better branding
6. **Monitor email delivery** rates and bounces

## File Structure

```
├── emailService.js              # Email sending and verification logic
├── server.js                    # Backend endpoints (updated)
├── validation.js                # Shared validation utilities
├── src/
│   ├── Auth.tsx                 # Updated with verification flow
│   ├── VerificationCodeInput.tsx # 6-digit code input component
│   └── validation.ts            # Frontend validation utilities
└── .env.example                 # Example environment configuration
```

## Support

For issues or questions, check:
- Console logs for error messages
- Server output for verification codes (if SMTP not configured)
- .env file for correct SMTP configuration
