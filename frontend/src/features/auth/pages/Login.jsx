 
import React from "react";
import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { useAuth } from "../hooks/useAuth";
const Login = () => {
  const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [errorMsg, setErrorMsg] = useState("");
    const {loading, handleLogin} = useAuth()

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    const res = await handleLogin({email, password});
    if (res?.error) {
      setErrorMsg(res.error);
    } else {
      navigate("/");
    }
  };

  return (
    <>
      {loading && (
        <div className="pdf-overlay loading-screen">
          <div className="pdf-overlay-card loader-card">
            <div className="pdf-anim-ring">
              <svg viewBox="0 0 50 50" className="pdf-ring-svg">
                <circle cx="25" cy="25" r="20" fill="none" stroke="rgba(212, 130, 26, 0.15)" strokeWidth="3" />
                <circle cx="25" cy="25" r="20" fill="none" stroke="url(#pdf-grad)" strokeWidth="3" strokeDasharray="80 126" strokeLinecap="round" className="pdf-ring-spin" />
                <defs>
                  <linearGradient id="pdf-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#8a5210" />
                    <stop offset="50%" stopColor="#d4821a" />
                    <stop offset="100%" stopColor="#c8783a" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <h2>Authenticating</h2>
            <p>Accessing the mainframe...</p>
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
          <h1>Welcome to the Grid ⚡</h1>
          <p className="login-subtitle">
            The algorithm is primed. Time to secure your next big offer. 🎯
          </p>
        </header>

        <form className="login-form" onSubmit={handleSubmit}>
          {errorMsg && (
            <div className="form-error" style={{ marginBottom: '1.25rem' }}>
              <span>⚠️</span>
              <p>{errorMsg}</p>
            </div>
          )}
          
          <label htmlFor="login-email">Email address</label>
          <input
            id="login-email"
            name="email"
            type="email"
            placeholder="visionary@future.io"
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <label htmlFor="login-password">Password</label>
          <input
            id="login-password"
            name="password"
            type="password"
            placeholder="Your access key 🔑"
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {/* FORGOT PASSWORD LINK: Navigates to the multi-step password reset page.
              Positioned below the password field for easy discovery when a user
              can't remember their credentials. */}
          <div className="forgot-password-link">
            <Link to="/forgot-password">Forgot your access key? 🔑</Link>
          </div>

          <button type="submit" className="login-button">
            <span>Initialize Session 🚀</span>
          </button>
        </form>
        <p>
          Need clearance? <Link to="/register">Forge an account</Link> — the future awaits 🌌
        </p>
        </section>
      </main>
    </>
  );
};

export default Login;
