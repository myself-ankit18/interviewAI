const express = require('express');
const authRouter = express.Router();
const authController = require("../controllers/auth.controller");
const authMiddleware = require("../middlewares/auth.middleware")

authRouter.post("/register", authController.registerUserController);

authRouter.post("/login", authController.loginUserController);

authRouter.get("/logout",authController.logoutUserController);

authRouter.get("/get-me", authMiddleware.authUser, authController.getMeController);

// ─── REGISTRATION EMAIL VERIFICATION ROUTES ──────────────────────────────────
// These 2 routes handle inline email OTP verification during registration:
// 1. /send-registration-otp — Auto-triggered when user blurs email field on Register page
//    Validates email isn't taken, generates OTP, sends it to the email inbox
// 2. /verify-registration-otp — Auto-triggered when user types 6th OTP digit
//    Compares OTP, returns verified=true so the frontend can unlock the rest of the form
authRouter.post("/send-registration-otp", authController.sendRegistrationOtpController);
authRouter.post("/verify-registration-otp", authController.verifyRegistrationOtpController);

// ─── FORGOT PASSWORD ROUTES ──────────────────────────────────────────────
// These 3 routes handle the complete password reset flow:
// 1. /forgot-password — Accepts email, generates & sends OTP
// 2. /verify-otp — Accepts email + OTP, returns a short-lived reset token
// 3. /reset-password — Accepts reset token + new password, updates the password
authRouter.post("/forgot-password", authController.forgotPasswordController);
authRouter.post("/verify-otp", authController.verifyOtpController);
authRouter.post("/reset-password", authController.resetPasswordController);
authRouter.delete("/delete-account", authMiddleware.authUser, authController.deleteAccountController);
module.exports = authRouter;