// /* eslint-disable no-unused-vars */
import React from 'react'
import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { Link, useNavigate } from 'react-router'
const Register = () => {
    const navigate = useNavigate()
    const [username, setUsername] = useState("")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const {handleRegister,loading} = useAuth()
    const handleSubmit = async (e) => {
        e.preventDefault()
        // Handle registration logic here
        await handleRegister({username, email, password})
        navigate("/")
    }
    if (loading) {
        return <div>Loading...</div>
    }
  return (
    <>
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
          <h1>Forge Your Advantage ⚒️</h1>
          <p className="login-subtitle">Join an elite squad of candidates using AI to rewrite the rules of hiring. 🧠</p>
        </header>

        <form className="login-form" onSubmit={handleSubmit}>
          <label htmlFor="register-email">Email address</label>
          <input
            id="register-email"
            name="email"
            type="email"
            placeholder="pioneer@future.io"
            required
            onChange={(e)=>setEmail(e.target.value)}
          />

          <label htmlFor="register-username">Username</label>
          <input
            id="register-username"
            name="username"
            type="text"
            placeholder="CodeBreaker99"
            onChange={(e)=>setUsername(e.target.value)}
            required
          />

          <label htmlFor="register-password">Password</label>
          <input
            id="register-password"
            name="password"
            type="password"
            placeholder="FortKnox material 🛡️"
            onChange={(e)=>setPassword(e.target.value)}
            required
          />

          <button type="submit" className="login-button">
            <span>Establish Uplink 🛸</span>
          </button>
        </form>
        <p>Already have clearance? <Link to="/login">Access portal</Link> — welcome back 🤝</p>
      </section>
      </main>
    </>
  )
}

export default Register
