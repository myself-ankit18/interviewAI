const mongoose = require('mongoose');

// OTP MODEL: Stores hashed OTPs for password reset verification.
// Uses a TTL (Time-To-Live) index on 'createdAt' — MongoDB will automatically
// delete expired documents after 10 minutes, preventing database bloat.
const otpSchema = new mongoose.Schema({
    // The email address associated with the OTP request
    email: {
        type: String,
        required: [true, "Email is required for OTP"],
    },
    // The OTP is stored as a bcrypt hash (never plain text).
    // Same security principle as password storage — if the DB is compromised,
    // attackers can't read the OTPs.
    otp: {
        type: String,
        required: [true, "OTP is required"],
    },
    // Timestamp used by the TTL index to auto-expire the document
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 600 // 600 seconds = 10 minutes — document self-destructs after this
    }
});

const OTP = mongoose.model("otps", otpSchema);

module.exports = OTP;
