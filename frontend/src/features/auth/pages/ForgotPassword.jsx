import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { getSecurityQuestion, verifySecurityAnswer, resetPassword } from '../services/auth.api'

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

const ForgotPassword = () => {
    const navigate = useNavigate()

    // STEP TRACKER: Controls which form is visible (1 = email, 2 = Answer, 3 = new password)
    const [step, setStep] = useState(1)

    // Form fields
    const [email, setEmail] = useState("")
    const [securityQuestion, setSecurityQuestion] = useState("")
    const [securityAnswer, setSecurityAnswer] = useState("")
    
    const [newPassword, setNewPassword] = useState("")
    const [confirmNewPassword, setConfirmNewPassword] = useState("")

    // The reset token received after security answer verification (Step 2).
    const [resetToken, setResetToken] = useState("")

    // UI state
    const [loading, setLoading] = useState(false)
    const [errorMsg, setErrorMsg] = useState("")
    const [successMsg, setSuccessMsg] = useState("")

    // Validation states
    const [emailValid, setEmailValid] = useState(null)
    const [emailTouched, setEmailTouched] = useState(false)
    const [passwordMatch, setPasswordMatch] = useState(null)
    const [confirmTouched, setConfirmTouched] = useState(false)

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

    // ─── STEP 1: FETCH QUESTION ─────────────────────────────────────────────
    const handleFetchQuestion = async (e) => {
        e.preventDefault()
        setErrorMsg("")
        setSuccessMsg("")

        if (!EMAIL_REGEX.test(email)) {
            setErrorMsg("Please enter a valid email address")
            return
        }

        setLoading(true)
        try {
            const data = await getSecurityQuestion(email)
            setSecurityQuestion(data.securityQuestion)
            setStep(2) 
        } catch (error) {
            setErrorMsg(typeof error === 'string' ? error : 'Failed to retrieve security question.')
        } finally {
            setLoading(false)
        }
    }

    // ─── STEP 2: VERIFY ANSWER ───────────────────────────────────────────
    const handleVerifyAnswer = async (e) => {
        e.preventDefault()
        setErrorMsg("")
        setSuccessMsg("")

        if (!securityAnswer.trim()) {
            setErrorMsg("Please enter your security answer")
            return
        }

        setLoading(true)
        try {
            const data = await verifySecurityAnswer(email, securityAnswer)
            setResetToken(data.resetToken) // Store the reset token for Step 3
            setSuccessMsg("Answer verified! Set your new password.")
            setStep(3) 
        } catch (error) {
            setErrorMsg(typeof error === 'string' ? error : 'Verification failed.')
        } finally {
            setLoading(false)
        }
    }

    // ─── STEP 3: RESET PASSWORD ───────────────────────────────────────
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
            setTimeout(() => navigate("/login"), 2000)
        } catch (error) {
            setErrorMsg(typeof error === 'string' ? error : 'Password reset failed.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <>
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
                        <h2>{step === 1 ? 'Searching...' : step === 2 ? 'Verifying' : 'Resetting'}</h2>
                        <p>{step === 1 ? 'Locating secure file...' : step === 2 ? 'Validating your identity...' : 'Updating credentials...'}</p>
                    </div>
                </div>
            )}

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
                        <h1>Password Recovery 🔓</h1>
                        <p className="login-subtitle">
                            {step === 1 && "Enter your registered email to locate your security file. 📧"}
                            {step === 2 && "Answer your security question to prove your identity. 🔐"}
                            {step === 3 && "Almost there! Set your new password below. 🛡️"}
                        </p>

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

                    {step === 1 && (
                        <form className="login-form" onSubmit={handleFetchQuestion}>
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
                                <span>Find Account 🔎</span>
                            </button>
                        </form>
                    )}

                    {step === 2 && (
                        <form className="login-form" onSubmit={handleVerifyAnswer}>
                            <label style={{color: '#f0a040', marginBottom: '0.5rem'}}>Security Question:</label>
                            <div style={{
                                padding: '15px', 
                                backgroundColor: 'rgba(212, 130, 26, 0.08)', 
                                border: '1px solid rgba(212, 130, 26, 0.25)', 
                                borderRadius: '8px', 
                                marginBottom: '1.5rem',
                                color: '#e8e2d4',
                                fontWeight: '500'
                            }}>
                                "{securityQuestion}"
                            </div>

                            <label htmlFor="fp-answer">Your Answer</label>
                            <input
                                id="fp-answer"
                                name="securityAnswer"
                                type="text"
                                placeholder="Enter your answer"
                                required
                                value={securityAnswer}
                                onChange={(e) => setSecurityAnswer(e.target.value)}
                            />

                            <button type="submit" className="login-button" disabled={!securityAnswer.trim()}>
                                <span>Verify Answer ✓</span>
                            </button>
                        </form>
                    )}

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

                    <p style={{marginTop: '2rem'}}>Remember your password? <Link to="/login">Back to login</Link> 🔙</p>
                </section>
            </main>
        </>
    )
}

export default ForgotPassword
