// ForgotPassword.jsx — Multi-step password reset flow:
// Step 1: User enters their registered email → OTP is sent to that email
// Step 2: User enters the 6-digit OTP from their inbox → verified against server
// Step 3: User sets a new password (with confirm) → password is updated
//
// All 3 steps happen on this single page with smooth transitions between steps.
// A countdown timer shows how long before the OTP expires (10 minutes).
// "Resend OTP" becomes available after a 30-second cooldown to prevent spam.

import React, { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router'
import { forgotPassword, verifyOtp, resetPassword } from '../services/auth.api'

// Same email regex used in Register.jsx and the backend — consistency across all layers
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

const ForgotPassword = () => {
    const navigate = useNavigate()

    // STEP TRACKER: Controls which form is visible (1 = email, 2 = OTP, 3 = new password)
    const [step, setStep] = useState(1)

    // Form fields
    const [email, setEmail] = useState("")
    const [otp, setOtp] = useState("")
    const [newPassword, setNewPassword] = useState("")
    const [confirmNewPassword, setConfirmNewPassword] = useState("")

    // The reset token received after OTP verification (Step 2).
    // This JWT authorizes the password reset in Step 3.
    const [resetToken, setResetToken] = useState("")

    // UI state
    const [loading, setLoading] = useState(false)
    const [errorMsg, setErrorMsg] = useState("")
    const [successMsg, setSuccessMsg] = useState("")

    // OTP COUNTDOWN TIMER: Counts down from 600 seconds (10 minutes).
    // Shows the user how much time they have before the OTP expires.
    const [otpCountdown, setOtpCountdown] = useState(0)
    const countdownRef = useRef(null)

    // RESEND COOLDOWN: Prevents OTP spam. User must wait 30 seconds before resending.
    const [resendCooldown, setResendCooldown] = useState(0)
    const resendRef = useRef(null)

    // Validation states
    const [emailValid, setEmailValid] = useState(null)
    const [emailTouched, setEmailTouched] = useState(false)
    const [passwordMatch, setPasswordMatch] = useState(null)
    const [confirmTouched, setConfirmTouched] = useState(false)

    // COUNTDOWN EFFECT: Decrements every second when active.
    // Clears the interval when it reaches 0 or when the component unmounts.
    useEffect(() => {
        if (otpCountdown > 0) {
            countdownRef.current = setInterval(() => {
                setOtpCountdown(prev => {
                    if (prev <= 1) {
                        clearInterval(countdownRef.current)
                        return 0
                    }
                    return prev - 1
                })
            }, 1000)
        }
        return () => clearInterval(countdownRef.current)
    }, [otpCountdown])

    // RESEND COOLDOWN EFFECT: Same pattern as OTP countdown but for the 30s resend timer.
    useEffect(() => {
        if (resendCooldown > 0) {
            resendRef.current = setInterval(() => {
                setResendCooldown(prev => {
                    if (prev <= 1) {
                        clearInterval(resendRef.current)
                        return 0
                    }
                    return prev - 1
                })
            }, 1000)
        }
        return () => clearInterval(resendRef.current)
    }, [resendCooldown])

    // Helper: Format seconds into MM:SS display (e.g., 9:45)
    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60)
        const s = seconds % 60
        return `${m}:${s.toString().padStart(2, '0')}`
    }

    const handleEmailChange = (e) => {
        const value = e.target.value;
        setEmail(value);
        if (value.length > 0) {
            setEmailTouched(true);
            setEmailValid(EMAIL_REGEX.test(value));
        } else {
            setEmailTouched(false);
            setEmailValid(null);
        }
    }

    const handleNewPasswordChange = (e) => {
        const value = e.target.value;
        setNewPassword(value);
        if (confirmTouched && confirmNewPassword.length > 0) {
            setPasswordMatch(value === confirmNewPassword);
        }
    }

    const handleConfirmNewPasswordChange = (e) => {
        const value = e.target.value;
        setConfirmNewPassword(value);
        setConfirmTouched(true);
        if (value.length > 0) {
            setPasswordMatch(value === newPassword);
        } else {
            setPasswordMatch(null);
        }
    }

    // ─── STEP 1: SEND OTP ─────────────────────────────────────────────
    // Calls the backend to generate an OTP and email it to the user.
    // On success, advances to Step 2 and starts the countdown timer.
    const handleSendOtp = async (e) => {
        e.preventDefault()
        setErrorMsg("")
        setSuccessMsg("")

        if (!EMAIL_REGEX.test(email)) {
            setErrorMsg("Please enter a valid email address")
            return
        }

        setLoading(true)
        try {
            const data = await forgotPassword(email)
            setSuccessMsg(data.message || "OTP sent to your email!")
            setStep(2) // Advance to OTP entry step
            setOtpCountdown(600) // Start 10-minute countdown
            setResendCooldown(30) // Prevent immediate resend (30s cooldown)
        } catch (error) {
            setErrorMsg(typeof error === 'string' ? error : 'Failed to send OTP. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    // RESEND OTP: Same as handleSendOtp but doesn't change the step.
    // Only available after the 30-second cooldown expires.
    const handleResendOtp = async () => {
        if (resendCooldown > 0) return // Still in cooldown period
        setErrorMsg("")
        setSuccessMsg("")
        setLoading(true)
        try {
            const data = await forgotPassword(email)
            setSuccessMsg("New OTP sent to your email!")
            setOtp("") // Clear any previously entered OTP
            setOtpCountdown(600) // Reset the countdown
            setResendCooldown(30) // Reset the resend cooldown
        } catch (error) {
            setErrorMsg(typeof error === 'string' ? error : 'Failed to resend OTP.')
        } finally {
            setLoading(false)
        }
    }

    // ─── STEP 2: VERIFY OTP ───────────────────────────────────────────
    // Sends the user-entered OTP to the backend for verification.
    // On success, receives a short-lived reset token and advances to Step 3.
    const handleVerifyOtp = async (e) => {
        e.preventDefault()
        setErrorMsg("")
        setSuccessMsg("")

        if (!otp || otp.length !== 6) {
            setErrorMsg("Please enter the 6-digit OTP from your email")
            return
        }

        setLoading(true)
        try {
            const data = await verifyOtp(email, otp)
            setResetToken(data.resetToken) // Store the reset token for Step 3
            setSuccessMsg("OTP verified! Set your new password.")
            setStep(3) // Advance to password reset step
            clearInterval(countdownRef.current) // Stop the OTP countdown (no longer relevant)
        } catch (error) {
            setErrorMsg(typeof error === 'string' ? error : 'OTP verification failed.')
        } finally {
            setLoading(false)
        }
    }

    // ─── STEP 3: RESET PASSWORD ───────────────────────────────────────
    // Uses the reset token from Step 2 to authorize setting a new password.
    // On success, redirects to the login page.
    const handleResetPassword = async (e) => {
        e.preventDefault()
        setErrorMsg("")
        setSuccessMsg("")

        if (newPassword.length < 6) {
            setErrorMsg("Password must be at least 6 characters")
            return
        }

        if (newPassword !== confirmNewPassword) {
            setErrorMsg("Passwords do not match")
            return
        }

        setLoading(true)
        try {
            const data = await resetPassword(resetToken, newPassword)
            setSuccessMsg(data.message || "Password reset successfully!")
            // Redirect to login after a short delay so user sees the success message
            setTimeout(() => navigate("/login"), 2000)
        } catch (error) {
            setErrorMsg(typeof error === 'string' ? error : 'Password reset failed.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <>
            {/* Loading overlay — same style as Login page for consistency */}
            {loading && (
                <div className="pdf-overlay loading-screen">
                    <div className="pdf-overlay-card loader-card">
                        <div className="pdf-anim-ring">
                            <svg viewBox="0 0 50 50" className="pdf-ring-svg">
                                <circle cx="25" cy="25" r="20" fill="none" stroke="rgba(212, 130, 26, 0.15)" strokeWidth="3" />
                                <circle cx="25" cy="25" r="20" fill="none" stroke="url(#pdf-grad-fp)" strokeWidth="3" strokeDasharray="80 126" strokeLinecap="round" className="pdf-ring-spin" />
                                <defs>
                                    <linearGradient id="pdf-grad-fp" x1="0%" y1="0%" x2="100%" y2="100%">
                                        <stop offset="0%" stopColor="#8a5210" />
                                        <stop offset="50%" stopColor="#d4821a" />
                                        <stop offset="100%" stopColor="#c8783a" />
                                    </linearGradient>
                                </defs>
                            </svg>
                        </div>
                        <h2>{step === 1 ? 'Sending OTP' : step === 2 ? 'Verifying' : 'Resetting'}</h2>
                        <p>{step === 1 ? 'Dispatching secure code...' : step === 2 ? 'Validating your identity...' : 'Updating credentials...'}</p>
                    </div>
                </div>
            )}

            <nav className="auth-nav">
                <div className="auth-nav-logo">
                    <span className="nav-icon">🪄</span>
                    <span className="nav-brand">InterviewGenie</span>
                </div>
                <div className="auth-nav-tagline">AI Interview Intelligence</div>
            </nav>

            <main className="login-page">
                <section className="login-card">
                    <header className="login-header">
                        <h1>Password Recovery 🔓</h1>
                        <p className="login-subtitle">
                            {step === 1 && "Enter your registered email to receive a secure OTP code. 📧"}
                            {step === 2 && "Check your inbox and enter the 6-digit code we just sent. 🔢"}
                            {step === 3 && "Almost there! Set your new password below. 🛡️"}
                        </p>

                        {/* STEP INDICATOR: Visual dots showing progress through the 3-step flow */}
                        <div className="step-indicator">
                            <div className={`step-dot ${step >= 1 ? 'active' : ''} ${step > 1 ? 'completed' : ''}`}>
                                <span>1</span>
                                <p>Email</p>
                            </div>
                            <div className={`step-line ${step > 1 ? 'active' : ''}`}></div>
                            <div className={`step-dot ${step >= 2 ? 'active' : ''} ${step > 2 ? 'completed' : ''}`}>
                                <span>2</span>
                                <p>Verify</p>
                            </div>
                            <div className={`step-line ${step > 2 ? 'active' : ''}`}></div>
                            <div className={`step-dot ${step >= 3 ? 'active' : ''}`}>
                                <span>3</span>
                                <p>Reset</p>
                            </div>
                        </div>
                    </header>

                    {/* Messages */}
                    {errorMsg && (
                        <div className="form-error fp-message" style={{ marginBottom: '1.25rem' }}>
                            <span>⚠️</span>
                            <p>{errorMsg}</p>
                        </div>
                    )}
                    {successMsg && (
                        <div className="form-success fp-message" style={{ marginBottom: '1.25rem' }}>
                            <span>✅</span>
                            <p>{successMsg}</p>
                        </div>
                    )}

                    {/* ─── STEP 1: EMAIL INPUT ──────────────────────────────────── */}
                    {step === 1 && (
                        <form className="login-form" onSubmit={handleSendOtp}>
                            <label htmlFor="fp-email">Registered Email</label>
                            <div className="input-with-indicator">
                                <input
                                    id="fp-email"
                                    name="email"
                                    type="email"
                                    placeholder="pioneer@future.io"
                                    required
                                    value={email}
                                    onChange={handleEmailChange}
                                    className={emailTouched ? (emailValid ? 'input-valid' : 'input-invalid') : ''}
                                />
                                {emailTouched && (
                                    <span className={`field-indicator ${emailValid ? 'valid' : 'invalid'}`}>
                                        {emailValid ? '✓' : '✗'}
                                    </span>
                                )}
                            </div>
                            {emailTouched && !emailValid && (
                                <p className="field-error-msg">Enter a valid email address</p>
                            )}

                            <button type="submit" className="login-button" disabled={!emailValid}>
                                <span>Send OTP 📨</span>
                            </button>
                        </form>
                    )}

                    {/* ─── STEP 2: OTP INPUT ────────────────────────────────────── */}
                    {step === 2 && (
                        <form className="login-form" onSubmit={handleVerifyOtp}>
                            {/* COUNTDOWN TIMER: Shows remaining time before OTP expires */}
                            {otpCountdown > 0 && (
                                <div className="otp-countdown">
                                    <span className="countdown-icon">⏱️</span>
                                    <span className="countdown-text">
                                        OTP expires in <strong>{formatTime(otpCountdown)}</strong>
                                    </span>
                                </div>
                            )}
                            {otpCountdown === 0 && step === 2 && (
                                <div className="otp-countdown expired">
                                    <span className="countdown-icon">❌</span>
                                    <span className="countdown-text">OTP has expired. Please resend.</span>
                                </div>
                            )}

                            <label htmlFor="fp-otp">Enter 6-Digit OTP</label>
                            <input
                                id="fp-otp"
                                name="otp"
                                type="text"
                                placeholder="• • • • • •"
                                required
                                value={otp}
                                onChange={(e) => {
                                    // OTP INPUT FILTER: Only allow digits, max 6 characters.
                                    // Strips any non-numeric characters automatically.
                                    const val = e.target.value.replace(/\D/g, '').slice(0, 6)
                                    setOtp(val)
                                }}
                                maxLength={6}
                                className="otp-input-field"
                                style={{ letterSpacing: '0.5em', textAlign: 'center', fontSize: '1.3rem', fontFamily: 'var(--font-mono)' }}
                            />

                            <button type="submit" className="login-button" disabled={otp.length !== 6 || otpCountdown === 0}>
                                <span>Verify OTP ✓</span>
                            </button>

                            {/* RESEND OTP LINK: Available after 30-second cooldown */}
                            <p className="resend-otp-text">
                                Didn't receive the code?{' '}
                                {resendCooldown > 0 ? (
                                    <span className="resend-cooldown">Resend in {resendCooldown}s</span>
                                ) : (
                                    <button type="button" className="resend-otp-btn" onClick={handleResendOtp}>
                                        Resend OTP
                                    </button>
                                )}
                            </p>
                        </form>
                    )}

                    {/* ─── STEP 3: NEW PASSWORD ─────────────────────────────────── */}
                    {step === 3 && (
                        <form className="login-form" onSubmit={handleResetPassword}>
                            <label htmlFor="fp-new-password">New Password</label>
                            <input
                                id="fp-new-password"
                                name="newPassword"
                                type="password"
                                placeholder="Your new access key 🔑"
                                required
                                minLength={6}
                                value={newPassword}
                                onChange={handleNewPasswordChange}
                            />

                            <label htmlFor="fp-confirm-password">Confirm New Password</label>
                            <div className="input-with-indicator">
                                <input
                                    id="fp-confirm-password"
                                    name="confirmNewPassword"
                                    type="password"
                                    placeholder="Repeat your new key 🔑"
                                    required
                                    minLength={6}
                                    value={confirmNewPassword}
                                    onChange={handleConfirmNewPasswordChange}
                                    className={confirmTouched && confirmNewPassword.length > 0 ? (passwordMatch ? 'input-valid' : 'input-invalid') : ''}
                                />
                                {confirmTouched && confirmNewPassword.length > 0 && (
                                    <span className={`field-indicator ${passwordMatch ? 'valid' : 'invalid'}`}>
                                        {passwordMatch ? '✓' : '✗'}
                                    </span>
                                )}
                            </div>
                            {confirmTouched && confirmNewPassword.length > 0 && !passwordMatch && (
                                <p className="field-error-msg">Passwords do not match</p>
                            )}

                            <button type="submit" className="login-button" disabled={!passwordMatch || newPassword.length < 6}>
                                <span>Reset Password 🔐</span>
                            </button>
                        </form>
                    )}

                    <p>Remember your password? <Link to="/login">Back to login</Link> 🔙</p>
                </section>
            </main>
        </>
    )
}

export default ForgotPassword
