const userModel = require("../models/user.model")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const tokenBlacklistModel = require("../models/blacklist.model")
const otpModel = require("../models/otp.model")
const { sendOtpEmail } = require("../services/email.service")
const crypto = require("crypto")

// EMAIL VALIDATION REGEX (RFC 5322 simplified):
// - Checks for: local-part@domain.tld
// - local-part: allows letters, digits, dots, hyphens, underscores, plus signs
// - domain: must have at least one dot (e.g., gmail.com, mail.co.uk)
// - TLD: must be at least 2 characters (rejects things like user@domain.x)
// This runs on the server as a security backstop — frontend validation alone
// can be bypassed by API calls or browser dev tools.
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

// ─── REGISTRATION EMAIL OTP FLOW ─────────────────────────────────────────────
// Before a user can register, they must prove they own the email address.
// Flow: User enters email on Register page → frontend auto-sends OTP on blur →
// OTP input slides in → user enters 6 digits → auto-verified → form unlocks.
//
// Two new endpoints power this:
// 1. /send-registration-otp — Validates email isn't taken, generates OTP, emails it
// 2. /verify-registration-otp — Compares OTP, returns verified=true if correct

async function sendRegistrationOtpController(req, res) {
    const { email } = req.body;

    // Validate email was provided
    if (!email) {
        return res.status(400).json({
            success: false,
            message: "Email is required"
        })
    }

    // EMAIL FORMAT VALIDATION: Reject malformed emails before doing any DB work
    if (!EMAIL_REGEX.test(email)) {
        return res.status(400).json({
            success: false,
            message: "Invalid email format"
        })
    }

    // Check if email is already registered to prevent duplicate accounts.
    // This runs BEFORE creating the user, so no user document exists yet —
    // we're just checking if someone already registered with this email.
    const existingUser = await userModel.findOne({ email });
    if (existingUser) {
        return res.status(400).json({
            success: false,
            message: "This email is already registered. Please login instead."
        })
    }

    // Delete any existing OTPs for this email (cleanup from previous attempts)
    await otpModel.deleteMany({ email });

    // GENERATE OTP: crypto.randomInt provides cryptographically secure random numbers.
    // Range 100000–999999 guarantees exactly 6 digits.
    const otp = crypto.randomInt(100000, 999999).toString();

    // HASH THE OTP before storing (same security principle as passwords)
    const hashedOtp = await bcrypt.hash(otp, 10);

    // Store hashed OTP with TTL auto-expiry (10 minutes, configured in otp.model.js)
    await otpModel.create({
        email,
        otp: hashedOtp
    });

    // Send the PLAIN OTP to the user's inbox
    try {
        await sendOtpEmail(email, otp);
    } catch (error) {
        console.error("Failed to send registration OTP email:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to send OTP email. Please check your email address and try again."
        })
    }

    return res.status(200).json({
        success: true,
        message: "OTP sent to your email address"
    })
}

async function verifyRegistrationOtpController(req, res) {
    const { email, otp } = req.body;

    if (!email || !otp) {
        return res.status(400).json({
            success: false,
            message: "Email and OTP are required"
        })
    }

    // Find the most recent OTP for this email
    const otpRecord = await otpModel.findOne({ email }).sort({ createdAt: -1 });

    if (!otpRecord) {
        return res.status(400).json({
            success: false,
            message: "OTP has expired or was not found. Please request a new one."
        })
    }

    // COMPARE: bcrypt.compare checks user-supplied OTP against the hashed version
    const isOtpValid = await bcrypt.compare(otp, otpRecord.otp);

    if (!isOtpValid) {
        return res.status(400).json({
            success: false,
            message: "Invalid OTP",
            verified: false
        })
    }

    // OTP is valid — delete it (single-use, prevents replay attacks)
    await otpModel.deleteMany({ email });

    // Return verified=true. The frontend will use this to unlock the rest of the form.
    // We do NOT create the user here — that happens in registerUserController
    // when the user submits the full form.
    return res.status(200).json({
        success: true,
        message: "Email verified successfully",
        verified: true
    })
}

// ─── REGISTER ─────────────────────────────────────────────────────────────────
async function registerUserController(req, res) {
    const {username, email, password} = req.body;
    if(!username || !email || !password) {
        return res.status(400).json({
            success: false,
            message: "All fields are required"
        })
    }

    // EMAIL VALIDATION: Server-side check ensures only properly formatted
    // emails are stored in the database. This prevents garbage data even if
    // someone bypasses the frontend validation (e.g., via Postman or curl).
    if (!EMAIL_REGEX.test(email)) {
        return res.status(400).json({
            success: false,
            message: "Invalid email format. Please provide a valid email address (e.g., user@example.com)"
        })
    }

    const isUserAlreadyExist = await userModel.findOne({
        $or: [
            {username},
            {email}
        ]
    })
    if(isUserAlreadyExist) {
        return res.status(400).json({
            success: false,
            message: "User already exists"
        })
    }
    const hash = await bcrypt.hash(password, 10);

    // CREATE USER WITH isVerified=true: By the time this controller runs,
    // the email has already been verified via the inline OTP flow on the
    // Register page. So we mark the user as verified immediately.
    const user = await userModel.create({
        username,
        email,
        password: hash,
        isVerified: true  // Email was verified via OTP before reaching this point
    })
    const token = jwt.sign({id: user._id, username: user.username}, process.env.JWT_SECRET, {expiresIn: "1d"})
    res.cookie("token", token);
    return res.status(201).json({
        success: true,
        message: "User registered successfully",
        user:{
            id: user._id,
            username: user.username,
            email: user.email
        }
    })
}

// ─── LOGIN ────────────────────────────────────────────────────────────────────
async function loginUserController(req, res) {
    const {email, password} = req.body;
    if(!email || !password) {
        return res.status(400).json({
            success: false,
            message: "All fields are required"
        })
    }
    const user = await userModel.findOne({email})
    if(!user) {
        return res.status(400).json({
            success: false,
            message: "Invalid credentials"
        })
    }

    // VERIFICATION CHECK: If the user registered but never completed email
    // verification (e.g., they closed the browser mid-registration), block login.
    // This ensures only verified email owners can access the app.
    if (!user.isVerified) {
        return res.status(403).json({
            success: false,
            message: "Email not verified. Please register again to verify your email."
        })
    }

    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if(!isPasswordMatch) {
        return res.status(400).json({
            success: false,
            message: "Invalid credentials"
        })
    }
    const token = jwt.sign({id: user._id, username: user.username}, process.env.JWT_SECRET, {expiresIn: "1d"})
    res.cookie("token", token);
    return res.status(200).json({
        success: true,
        message: "User logged in successfully",
        user:{
            id: user._id,
            username: user.username,
            email: user.email
        }
    })
}

async function logoutUserController(req, res) {
    const token = req.cookies.token;
    if(token){
        await tokenBlacklistModel.create({token})
    }
    res.clearCookie("token");
    res.status(200).json({
        success: true,
        message: "User logged out successfully"
    })
}

async function getMeController(req, res) {
    const user = await userModel.findById(req.user.id);
    if(!user) {
        return res.status(404).json({
            success: false,
            message: "User not found"
        })
    }
    return res.status(200).json({
        success: true,
        user: {
            id: user._id,
            username: user.username,
            email: user.email
        }
    })
}

// ─── FORGOT PASSWORD FLOW ─────────────────────────────────────────────────────
// The forgot password system uses a 3-step process:
// Step 1: User provides email → server generates OTP, hashes it, stores in DB, sends plain OTP via email
// Step 2: User enters OTP → server verifies against hashed copy → issues a short-lived reset token
// Step 3: User provides new password + reset token → server validates token and updates password
//
// Security measures:
// - OTPs are hashed with bcrypt before storage (same as passwords)
// - OTPs auto-expire after 10 minutes via MongoDB TTL index
// - Reset tokens expire after 5 minutes (very short window)
// - Previous OTPs for same email are deleted before creating new one (prevents brute-force)

async function forgotPasswordController(req, res) {
    const { email } = req.body;

    // Validate that email was provided
    if (!email) {
        return res.status(400).json({
            success: false,
            message: "Email is required"
        })
    }

    // Check if the email exists in our database.
    const user = await userModel.findOne({ email });
    if (!user) {
        return res.status(400).json({
            success: false,
            message: "No account found with this email address"
        })
    }

    // Delete any existing OTPs for this email
    await otpModel.deleteMany({ email });

    // GENERATE OTP: crypto.randomInt provides cryptographically secure random numbers.
    const otp = crypto.randomInt(100000, 999999).toString();

    // HASH THE OTP before storing
    const hashedOtp = await bcrypt.hash(otp, 10);

    // Store the hashed OTP with TTL auto-expiry
    await otpModel.create({
        email,
        otp: hashedOtp
    });

    // Send the PLAIN OTP to the user's email
    try {
        await sendOtpEmail(email, otp);
    } catch (error) {
        console.error("Failed to send OTP email:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to send OTP email. Please try again later."
        })
    }

    return res.status(200).json({
        success: true,
        message: "OTP sent to your email address"
    })
}

async function verifyOtpController(req, res) {
    const { email, otp } = req.body;

    if (!email || !otp) {
        return res.status(400).json({
            success: false,
            message: "Email and OTP are required"
        })
    }

    const otpRecord = await otpModel.findOne({ email }).sort({ createdAt: -1 });

    if (!otpRecord) {
        return res.status(400).json({
            success: false,
            message: "OTP has expired or is invalid. Please request a new one."
        })
    }

    const isOtpValid = await bcrypt.compare(otp, otpRecord.otp);

    if (!isOtpValid) {
        return res.status(400).json({
            success: false,
            message: "Invalid OTP. Please check and try again."
        })
    }

    // OTP is valid — delete it immediately to prevent reuse
    await otpModel.deleteMany({ email });

    // ISSUE A RESET TOKEN: Short-lived JWT (5 minutes) that authorizes password reset
    const resetToken = jwt.sign(
        { email, purpose: "password-reset" },
        process.env.JWT_SECRET,
        { expiresIn: "5m" }
    );

    return res.status(200).json({
        success: true,
        message: "OTP verified successfully",
        resetToken
    })
}

async function resetPasswordController(req, res) {
    const { resetToken, newPassword } = req.body;

    if (!resetToken || !newPassword) {
        return res.status(400).json({
            success: false,
            message: "Reset token and new password are required"
        })
    }

    if (newPassword.length < 6) {
        return res.status(400).json({
            success: false,
            message: "Password must be at least 6 characters long"
        })
    }

    let decoded;
    try {
        decoded = jwt.verify(resetToken, process.env.JWT_SECRET);
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: "Reset token has expired or is invalid. Please request a new OTP."
        })
    }

    if (decoded.purpose !== "password-reset") {
        return res.status(400).json({
            success: false,
            message: "Invalid token type"
        })
    }

    const user = await userModel.findOne({ email: decoded.email });
    if (!user) {
        return res.status(404).json({
            success: false,
            message: "User not found"
        })
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    return res.status(200).json({
        success: true,
        message: "Password reset successfully. You can now log in with your new password."
    })
}


module.exports = {
    registerUserController,
    loginUserController,
    logoutUserController,
    getMeController,
    forgotPasswordController,
    verifyOtpController,
    resetPasswordController,
    sendRegistrationOtpController,
    verifyRegistrationOtpController
}