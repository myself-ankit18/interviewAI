 
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
          <span className="nav-icon">🪄</span>
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
