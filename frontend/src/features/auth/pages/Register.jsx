import React, { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { Link, useNavigate } from 'react-router'

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

const SECURITY_QUESTIONS = [
  "What city were you born in?",
  "What is the name of your first pet?",
  "What was the model of your first car?",
  "In what city or town did your parents meet?",
  "What is your mother's maiden name?"
];

const Register = () => {
    const navigate = useNavigate()
    const [username, setUsername] = useState("")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [securityQuestion, setSecurityQuestion] = useState(SECURITY_QUESTIONS[0])
    const [securityAnswer, setSecurityAnswer] = useState("")
    const [errorMsg, setErrorMsg] = useState("")
    
    const {handleRegister, loading} = useAuth()

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

    const handleSubmit = async (e) => {
        e.preventDefault()
        setErrorMsg("")

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
        
        if (!securityAnswer.trim()) {
            setErrorMsg("Please provide a security answer")
            return;
        }

        const res = await handleRegister({username, email, password, securityQuestion, securityAnswer})
        if (res?.error) {
            setErrorMsg(res.error)
        } else {
            navigate("/")
        }
    }

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
      <section className="login-card" style={{ maxWidth: '1000px', width: '100%' }}>
        <header className="login-header">
          <h1>Forge Your Advantage</h1>
          <p className="login-subtitle">Join an elite squad of candidates using AI to rewrite the rules of hiring. 🧠</p>
        </header>

        <form className="login-form" onSubmit={handleSubmit}>
          {errorMsg && (
            <div className="form-error" style={{ marginBottom: '1.25rem' }}>
              <span>⚠️</span>
              <p>{errorMsg}</p>
            </div>
          )}

          <div className="registration-fields fields-unlocked">
            {/* ROW 1: Email and Username */}
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="register-email">Email address</label>
                <div className="input-with-indicator">
                  <input
                    id="register-email"
                    name="email"
                    type="email"
                    placeholder="pioneer@future.io"
                    required
                    value={email}
                    onChange={handleEmailChange}
                    className={`${emailTouched ? (emailValid ? 'input-valid' : 'input-invalid') : ''}`}
                  />
                  {emailTouched && (
                    <span className={`field-indicator ${emailValid ? 'valid' : 'invalid'}`}>
                      {emailValid ? '✓' : '✗'}
                    </span>
                  )}
                </div>
                {emailTouched && !emailValid && (
                  <p className="field-error-msg">Valid email required</p>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="register-username">Username</label>
                <input
                  id="register-username"
                  name="username"
                  type="text"
                  placeholder="CodeBreaker99"
                  onChange={(e)=>setUsername(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* ROW 2: Passwords */}
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="register-password">Password</label>
                <input
                  id="register-password"
                  name="password"
                  type="password"
                  placeholder="FortKnox material 🛡️"
                  onChange={handlePasswordChange}
                  required
                  minLength={6}
                />
              </div>

              <div className="form-group">
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
              </div>
            </div>

            {/* ROW 3: Security Question & Answer */}
            <div className="form-row" style={{marginTop: '0.5rem', paddingTop: '1rem', borderTop: '1px solid rgba(212, 130, 26, 0.1)'}}>
              <div className="form-group">
                <label htmlFor="security-question" style={{color: '#f0a040'}}>Account Recovery Question</label>
                <p style={{fontSize: '0.75rem', color: '#a8a090', marginBottom: '0.5rem', marginTop: '-0.3rem'}}>No email verification used. This is your only backup.</p>
                
                <select 
                  id="security-question" 
                  value={securityQuestion}
                  onChange={(e) => setSecurityQuestion(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    backgroundColor: 'rgba(5, 5, 5, 0.6)',
                    border: '1px solid rgba(212, 130, 26, 0.3)',
                    borderRadius: '8px',
                    color: '#e8e2d4',
                    fontSize: '0.95rem',
                    marginBottom: '1rem'
                  }}
                >
                  {SECURITY_QUESTIONS.map((q, i) => (
                    <option key={i} value={q}>{q}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="security-answer" style={{marginTop: '1.25rem'}}>Your Answer</label>
                <input
                  id="security-answer"
                  name="securityAnswer"
                  type="text"
                  placeholder="Memorable but hard to guess"
                  onChange={(e) => setSecurityAnswer(e.target.value)}
                  required
                />
              </div>
            </div>

            <button type="submit" className="login-button" style={{marginTop: "1.5rem"}} disabled={
               !passwordMatch || !username || !email || !password || !confirmPassword || password.length < 6 || !securityAnswer.trim()
            }>
              <span>Establish Uplink 🛸</span>
            </button>
          </div>
        </form>
        <p style={{gridColumn: "1 / -1", textAlign: "center"}}>Already have clearance? <Link to="/login">Access portal</Link> — welcome back 🤝</p>
      </section>
      </main>
    </>
  )
}

export default Register
