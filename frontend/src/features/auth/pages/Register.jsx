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
    <main className="login-page">
      <section className="login-card">
        <header className="login-header">
          <h1>Join the Legends 🦸</h1>
          <p className="login-subtitle">One account away from interview domination. No capes required. 💪</p>
        </header>

        <form className="login-form" onSubmit={handleSubmit}>
          <label htmlFor="register-email">Email address</label>
          <input
            id="register-email"
            name="email"
            type="email"
            placeholder="rockstar@example.com"
            required
            onChange={(e)=>setEmail(e.target.value)}
          />

          <label htmlFor="register-username">Username</label>
          <input
            id="register-username"
            name="username"
            type="text"
            placeholder="TheInterviewSlayer"
            onChange={(e)=>setUsername(e.target.value)}
            required
          />

          <label htmlFor="register-password">Password</label>
          <input
            id="register-password"
            name="password"
            type="password"
            placeholder="Make it uncrackable 🔐"
            onChange={(e)=>setPassword(e.target.value)}
            required
          />

          <button type="submit" className="login-button">
            Create My Account ✨
          </button>
        </form>
        <p>Already one of us? <Link to="/login">Sign in</Link> — welcome back 🤝</p>
      </section>
    </main>
  )
}

export default Register
