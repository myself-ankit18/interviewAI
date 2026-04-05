// Register.jsx — Registration form with INLINE EMAIL VERIFICATION:
//
// THE FLOW:
// 1. User types email → real-time regex validation (✓/✗)
// 2. User clicks away (blur) → if valid format, OTP is AUTO-SENT to the email
// 3. OTP input SLIDES IN below email field with animation
// 4. User types 6 digits → on the 6th digit, OTP is AUTO-VERIFIED (no button!)
// 5. ✓ Green = verified, ✗ Red = wrong OTP
// 6. Rest of the form (username, passwords) UNLOCKS with a smooth transition
// 7. Submit button disabled until: email verified + passwords match + all filled
//
// NO extra buttons for "Send OTP" or "Verify OTP" — everything is automatic!

import React, { useState, useEffect, useRef } from 'react'
import { useAuth } from '../hooks/useAuth'
import { Link, useNavigate } from 'react-router'
import { sendRegistrationOtp, verifyRegistrationOtp } from '../services/auth.api'

// Same regex used on backend — consistency across all layers
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

const Register = () => {
    const navigate = useNavigate()
    const [username, setUsername] = useState("")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [errorMsg, setErrorMsg] = useState("")
    const {handleRegister, loading} = useAuth()

    // ─── EMAIL VALIDATION STATE ───────────────────────────────────────
    const [emailValid, setEmailValid] = useState(null)    // null=untouched, true/false=format check
    const [emailTouched, setEmailTouched] = useState(false)

    // ─── OTP STATE ────────────────────────────────────────────────────
    const [otpSent, setOtpSent] = useState(false)         // Whether OTP was sent (controls OTP field visibility)
    const [otpSending, setOtpSending] = useState(false)   // Loading spinner while sending OTP
    const [otp, setOtp] = useState("")                     // The 6-digit OTP entered by user
    const [otpVerified, setOtpVerified] = useState(false)  // Whether OTP was verified successfully
    const [otpVerifying, setOtpVerifying] = useState(false)// Loading state while verifying OTP
    const [otpError, setOtpError] = useState("")           // Error message for OTP (wrong code, expired, etc.)
    const [otpStatusMsg, setOtpStatusMsg] = useState("")   // Success message for OTP
    const otpInputRef = useRef(null)                       // Ref to auto-focus OTP input when it appears

    // RESEND COOLDOWN: Prevents spamming the "Resend OTP" action.
    // User must wait 30 seconds between resend attempts.
    const [resendCooldown, setResendCooldown] = useState(0)
    const resendRef = useRef(null)

    // ─── CONFIRM PASSWORD STATE ───────────────────────────────────────
    const [passwordMatch, setPasswordMatch] = useState(null)
    const [confirmTouched, setConfirmTouched] = useState(false)

    // Track the last email we sent OTP to, so we don't resend on every blur
    const lastOtpEmailRef = useRef("")

    // ─── RESEND COOLDOWN TIMER ────────────────────────────────────────
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

    // AUTO-FOCUS OTP INPUT: When the OTP field slides in, immediately focus it
    // so the user can start typing without clicking.
    useEffect(() => {
        if (otpSent && !otpVerified && otpInputRef.current) {
            otpInputRef.current.focus()
        }
    }, [otpSent, otpVerified])

    // ─── EMAIL CHANGE HANDLER ─────────────────────────────────────────
    // Validates email format on every keystroke. If the user changes the email
    // after OTP was already sent/verified, reset the OTP state (they changed emails).
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

        // RESET OTP STATE if email changes after OTP was sent:
        // If the user modifies their email, the previous OTP is no longer valid
        // for the new email, so we reset everything.
        if (otpSent && value !== lastOtpEmailRef.current) {
            setOtpSent(false);
            setOtp("");
            setOtpVerified(false);
            setOtpError("");
            setOtpStatusMsg("");
        }
    }

    // ─── SEND OTP MANUALLY ───────────────────────────────────────────
    // Triggered by the "Verify" button next to the email field.
    const handleSendOtp = async () => {
        if (!emailValid || !email) return;
        if (otpSent && email === lastOtpEmailRef.current) return; // Already sent for this email
        if (otpVerified) return; // Already verified, no action needed

        setOtpSending(true);
        setErrorMsg("");
        setOtpError("");
        setOtpStatusMsg("");

        try {
            await sendRegistrationOtp(email);
            setOtpSent(true);
            lastOtpEmailRef.current = email;
            setOtpStatusMsg("OTP sent to your email! Check your inbox ✉️");
            setResendCooldown(30); // Start 30s cooldown for resend
        } catch (error) {
            setErrorMsg(typeof error === 'string' ? error : 'Failed to send OTP.'); // Use main error banner
            setOtpSent(false);
        } finally {
            setOtpSending(false);
        }
    }

    // ─── OTP CHANGE HANDLER (AUTO-VERIFY ON 6TH DIGIT) ───────────────
    // Filters input to digits only, caps at 6 characters.
    // When the 6th digit is typed, AUTOMATICALLY calls the verification API.
    // No "Verify" button needed — it's instant!
    const handleOtpChange = async (e) => {
        const val = e.target.value.replace(/\D/g, '').slice(0, 6);
        setOtp(val);
        setOtpError("");

        // AUTO-VERIFY: Trigger verification when all 6 digits are entered
        if (val.length === 6) {
            setOtpVerifying(true);
            try {
                const data = await verifyRegistrationOtp(email, val);
                if (data.verified) {
                    setOtpVerified(true);
                    setOtpStatusMsg("Email verified successfully ✅");
                    setOtpError("");
                }
            } catch (error) {
                setOtpVerified(false);
                setOtpError(typeof error === 'string' ? error : 'Invalid OTP');
                // Clear the OTP field so user can try again
                setOtp("");
            } finally {
                setOtpVerifying(false);
            }
        }
    }

    // ─── RESEND OTP ───────────────────────────────────────────────────
    // Manually resend OTP (available after 30s cooldown).
    const handleResendOtp = async () => {
        if (resendCooldown > 0) return;
        setOtpSending(true);
        setOtpError("");
        setOtpStatusMsg("");
        setOtp("");

        try {
            await sendRegistrationOtp(email);
            setOtpStatusMsg("New OTP sent! Check your inbox ✉️");
            setResendCooldown(30);
        } catch (error) {
            setOtpError(typeof error === 'string' ? error : 'Failed to resend OTP.');
        } finally {
            setOtpSending(false);
        }
    }

    // ─── PASSWORD HANDLERS ────────────────────────────────────────────
    const handlePasswordChange = (e) => {
        const value = e.target.value;
        setPassword(value);
        if (confirmTouched && confirmPassword.length > 0) {
            setPasswordMatch(value === confirmPassword);
        }
    }

    const handleConfirmPasswordChange = (e) => {
        const value = e.target.value;
        setConfirmPassword(value);
        setConfirmTouched(true);
        if (value.length > 0) {
            setPasswordMatch(value === password);
        } else {
            setPasswordMatch(null);
        }
    }

    // ─── SUBMIT HANDLER ───────────────────────────────────────────────
    const handleSubmit = async (e) => {
        e.preventDefault()
        setErrorMsg("")

        // GUARD: Email must be OTP-verified before registration
        if (!otpVerified) {
            setErrorMsg("Please verify your email with OTP first");
            return;
        }

        if (!EMAIL_REGEX.test(email)) {
            setErrorMsg("Please enter a valid email address")
            return;
        }

        if (password !== confirmPassword) {
            setErrorMsg("Passwords do not match")
            return;
        }

        if (password.length < 6) {
            setErrorMsg("Password must be at least 6 characters long")
            return;
        }

        const res = await handleRegister({username, email, password})
        if (res?.error) {
            setErrorMsg(res.error)
        } else {
            navigate("/")
        }
    }

    // ─── LOADING SCREEN ───────────────────────────────────────────────
    if (loading) {
        return (
            <div className="pdf-overlay loading-screen">
                <div className="pdf-overlay-card loader-card">
                    <div className="pdf-anim-ring">
                        <svg viewBox="0 0 50 50" className="pdf-ring-svg">
                            <circle cx="25" cy="25" r="20" fill="none" stroke="rgba(212, 130, 26, 0.15)" strokeWidth="3" />
                            <circle cx="25" cy="25" r="20" fill="none" stroke="url(#pdf-grad-reg)" strokeWidth="3" strokeDasharray="80 126" strokeLinecap="round" className="pdf-ring-spin" />
                            <defs>
                                <linearGradient id="pdf-grad-reg" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" stopColor="#8a5210" />
                                    <stop offset="50%" stopColor="#d4821a" />
                                    <stop offset="100%" stopColor="#c8783a" />
                                </linearGradient>
                            </defs>
                        </svg>
                    </div>
                    <h2>Creating Account</h2>
                    <p>Establishing your uplink...</p>
                </div>
            </div>
        )
    }

  return (
    <>
      <nav className="auth-nav">
        <div className="auth-nav-logo">
          <span className="nav-icon">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M19.5 4.7832V7.6709L22 9.11426V14.8867L19.499 16.3311L19.5 19.2178L14.5 22.1045L12 20.6611L9.5 22.1045L4.5 19.2178V16.3311L2 14.8877L2.00098 9.11328L4.5 7.66992V4.78418L9.5 1.89746L11.999 3.34082L14.501 1.89648L19.5 4.7832ZM13 5.07227L12.999 8.42285L15.9639 10.1338L14.9639 11.8662L11 9.57715V5.07324L9.5 4.20703L6.49902 5.93848V8.8252L4 10.2676V13.7334L6.5 15.1768V18.0635L9.5 19.7959L11 18.9287L11.001 15.5771L8.03613 13.8652L9.03613 12.1338L13.001 14.4229V18.9297L14.5 19.7959L17.5 18.0625V15.1768L20 13.7324V10.2695L17.499 8.8252L17.5 5.9375L14.501 4.20605L13 5.07227Z"></path></svg>
          </span>
          <span className="nav-brand">InterviewGenie</span>
        </div>
        <div className="auth-nav-tagline">AI Interview Intelligence</div>
      </nav>

      <main className="login-page">
      <section className="login-card">
        <header className="login-header">
          <h1>Forge Your Advantage</h1>
          <p className="login-subtitle">Join an elite squad of candidates using AI to rewrite the rules of hiring. 🧠</p>
        </header>

        <form className="login-form" onSubmit={handleSubmit}>
          {/* ERROR MESSAGE BANNER */}
          {errorMsg && (
            <div className="form-error" style={{ marginBottom: '1.25rem' }}>
              <span>⚠️</span>
              <p>{errorMsg}</p>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════
              EMAIL FIELD + INLINE OTP VERIFICATION SECTION
              This is the core UX: email input + auto-appearing OTP input
              ═══════════════════════════════════════════════════════════════ */}
          <label htmlFor="register-email">
            Email address
            {/* SENDING INDICATOR: Small spinner shown while OTP is being dispatched */}
            {otpSending && <span className="sending-indicator">⏳ Sending OTP...</span>}
          </label>
          <div className="input-with-indicator">
            <input
              id="register-email"
              name="email"
              type="email"
              placeholder="pioneer@future.io"
              required
              value={email}
              onChange={handleEmailChange}
              className={`${emailTouched ? (emailValid ? 'input-valid' : 'input-invalid') : ''} ${otpVerified ? 'input-verified' : ''}`}
              disabled={otpVerified}     // Lock email field once verified (can't change it)
            />
            {/* MANUAL VERIFY BUTTON: Only shown if email is valid and OTP not yet sent/verified */}
            {emailValid && !otpSent && !otpVerified && (
              <button 
                type="button" 
                className="verify-inline-btn" 
                onClick={handleSendOtp}
                disabled={otpSending}
              >
                {otpSending ? '...' : 'Verify'}
              </button>
            )}
            {/* EMAIL FORMAT INDICATOR: Only shown if invalid, OR if valid and OTP already sent/verified */}
            {emailTouched && !otpVerified && (!emailValid || otpSent) && (
              <span className={`field-indicator ${emailValid ? 'valid' : 'invalid'}`}>
                {emailValid ? '✓' : '✗'}
              </span>
            )}
            {/* VERIFIED BADGE: Replaces the format indicator once OTP is confirmed */}
            {otpVerified && (
              <span className="field-indicator valid">✓</span>
            )}
          </div>
          {emailTouched && !emailValid && !otpSent && (
            <p className="field-error-msg">Enter a valid email (e.g., user@example.com)</p>
          )}

          {/* ─── INLINE OTP SECTION ────────────────────────────────────────
              This entire block SLIDES IN after OTP is sent.
              It's hidden until otpSent=true, then animates into view. */}
          {otpSent && !otpVerified && (
            <div className="otp-inline-section">
              {/* OTP STATUS MESSAGES */}
              {otpStatusMsg && (
                <div className="otp-status-msg success">
                  <span>✉️</span> {otpStatusMsg}
                </div>
              )}
              {otpError && (
                <div className="otp-status-msg error">
                  <span>❌</span> {otpError}
                </div>
              )}

              <label htmlFor="register-otp">
                Enter 6-Digit OTP
                {otpVerifying && <span className="sending-indicator">🔄 Verifying...</span>}
              </label>
              <div className="input-with-indicator">
                <input
                  ref={otpInputRef}
                  id="register-otp"
                  name="otp"
                  type="text"
                  placeholder="• • • • • •"
                  value={otp}
                  onChange={handleOtpChange}  // AUTO-VERIFY on 6th digit
                  maxLength={6}
                  className="otp-inline-input"
                  style={{ letterSpacing: '0.5em', textAlign: 'center', fontSize: '1.3rem', fontFamily: 'var(--font-mono)' }}
                  autoComplete="one-time-code"
                />
              </div>

              {/* RESEND OTP: Available after 30s cooldown */}
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
            </div>
          )}

          {/* VERIFIED SUCCESS MESSAGE */}
          {otpVerified && (
            <div className="otp-status-msg success" style={{ marginTop: '0.5rem' }}>
              <span>✅</span> Email verified — you're in!
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════
              REMAINING FIELDS — LOCKED until email is OTP-verified
              These fields are visually dimmed and disabled until otpVerified=true.
              Once verified, they smoothly transition to their active state.
              ═══════════════════════════════════════════════════════════════ */}
          <div className={`registration-fields ${otpVerified ? 'fields-unlocked' : 'fields-locked'}`}>
            <label htmlFor="register-username">Username</label>
            <input
              id="register-username"
              name="username"
              type="text"
              placeholder="CodeBreaker99"
              onChange={(e)=>setUsername(e.target.value)}
              required
              disabled={!otpVerified}  // Disabled until email verified
            />

            <label htmlFor="register-password">Password</label>
            <input
              id="register-password"
              name="password"
              type="password"
              placeholder="FortKnox material 🛡️"
              onChange={handlePasswordChange}
              required
              minLength={6}
              disabled={!otpVerified}
            />

            {/* CONFIRM PASSWORD: Real-time match detection */}
            <label htmlFor="register-confirm-password">Confirm Password</label>
            <div className="input-with-indicator">
              <input
                id="register-confirm-password"
                name="confirmPassword"
                type="password"
                placeholder="Repeat your access key 🔑"
                onChange={handleConfirmPasswordChange}
                required
                minLength={6}
                disabled={!otpVerified}
                className={confirmTouched && confirmPassword.length > 0 ? (passwordMatch ? 'input-valid' : 'input-invalid') : ''}
              />
              {confirmTouched && confirmPassword.length > 0 && (
                <span className={`field-indicator ${passwordMatch ? 'valid' : 'invalid'}`}>
                  {passwordMatch ? '✓' : '✗'}
                </span>
              )}
            </div>
            {confirmTouched && confirmPassword.length > 0 && !passwordMatch && (
              <p className="field-error-msg">Passwords do not match</p>
            )}

            <button type="submit" className="login-button" disabled={
              // SUBMIT DISABLED UNTIL ALL CONDITIONS MET:
              // 1. Email must be OTP-verified
              // 2. Passwords must match
              // 3. All fields must be filled
              // 4. Password must be >= 6 characters
              !otpVerified || !passwordMatch || !username || !email || !password || !confirmPassword || password.length < 6
            }>
              <span>Establish Uplink 🛸</span>
            </button>
          </div>
        </form>
        <p>Already have clearance? <Link to="/login">Access portal</Link> — welcome back 🤝</p>
      </section>
      </main>
    </>
  )
}

export default Register
