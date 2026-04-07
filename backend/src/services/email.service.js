const nodemailer = require("nodemailer");

// EMAIL SERVICE: Configures a reusable Nodemailer transporter for sending emails.
// Uses Gmail SMTP with an App Password (not your regular Gmail password).
// To generate an App Password: Google Account → Security → 2-Step Verification → App passwords

const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true, // true for 465, false for other ports
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS || process.env.EMAIL_PASSWORD,
    },
});

/**
 * sendOtpEmail — Sends a styled HTML email containing the 6-digit OTP.
 * @param {string} toEmail - The recipient's email address
 * @param {string} otp - The plain-text 6-digit OTP to include in the email
 * @param {string} purpose - Either "registration" or "password-reset" (changes email content)
 * 
 * The 'purpose' parameter controls the subject line, header, and body text
 * so the user receives contextually appropriate messaging.
 */
async function sendOtpEmail(toEmail, otp, purpose = "password-reset") {

    // DYNAMIC CONTENT: Changes the email messaging based on why the OTP was generated.
    // "registration" = user is signing up, email is for verifying ownership of the inbox.
    // "password-reset" = user forgot password, email is for authorizing a password change.
    const isRegistration = purpose === "registration";

    const subject = isRegistration
        ? "✉️ Verify Your Email — InterviewGenie"
        : "🔐 Your Password Reset OTP — InterviewGenie";

    const headerText = isRegistration
        ? "Email Verification"
        : "Password Reset Request";

    const bodyText = isRegistration
        ? "Welcome to InterviewGenie! Please verify your email address by entering the OTP below:"
        : "We received a request to reset your password. Use the OTP below to verify your identity:";

    const footerNote = isRegistration
        ? "🚀 Once verified, you'll be able to complete your registration."
        : "🛡️ If you didn't request this, you can safely ignore this email.";

    const mailOptions = {
        from: `"InterviewGenie 🪄" <${process.env.EMAIL_USER}>`,
        to: toEmail,
        subject: subject,
        html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 480px; margin: 0 auto; background: #0f0e0c; border: 1px solid rgba(212, 130, 26, 0.2); border-radius: 16px; overflow: hidden;">
            
            <!-- Header bar with accent gradient -->
            <div style="background: linear-gradient(135deg, #8a5210, #d4821a, #c8783a); padding: 24px 32px;">
                <h1 style="margin: 0; color: #0f0e0c; font-size: 20px; font-weight: 700;">🪄 InterviewGenie</h1>
                <p style="margin: 4px 0 0; color: rgba(15, 14, 12, 0.7); font-size: 12px; letter-spacing: 1px; text-transform: uppercase;">${headerText}</p>
            </div>
            
            <!-- Body -->
            <div style="padding: 32px;">
                <p style="color: #e8e2d4; font-size: 15px; line-height: 1.6; margin: 0 0 24px;">
                    ${bodyText}
                </p>
                
                <!-- OTP Display Box -->
                <div style="background: rgba(212, 130, 26, 0.08); border: 1px solid rgba(212, 130, 26, 0.25); border-radius: 12px; padding: 20px; text-align: center; margin: 0 0 24px;">
                    <p style="margin: 0 0 8px; color: #a8a090; font-size: 11px; text-transform: uppercase; letter-spacing: 2px;">Your OTP Code</p>
                    <h2 style="margin: 0; color: #f0a040; font-size: 36px; font-family: 'Courier New', monospace; letter-spacing: 8px; font-weight: 700;">${otp}</h2>
                </div>
                
                <!-- Warning -->
                <p style="color: #a8a090; font-size: 13px; line-height: 1.6; margin: 0 0 8px;">
                    ⏱️ This code expires in <strong style="color: #f0a040;">10 minutes</strong>.
                </p>
                <p style="color: #a8a090; font-size: 13px; line-height: 1.6; margin: 0;">
                    ${footerNote}
                </p>
            </div>
            
            <!-- Footer -->
            <div style="border-top: 1px solid rgba(212, 130, 26, 0.1); padding: 16px 32px; text-align: center;">
                <p style="margin: 0; color: #5c5649; font-size: 11px;">InterviewGenie — AI Interview Intelligence</p>
            </div>
        </div>
        `,
    };

    await transporter.sendMail(mailOptions);
}

module.exports = { sendOtpEmail };
