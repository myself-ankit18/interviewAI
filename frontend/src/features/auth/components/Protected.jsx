import { useAuth } from "../hooks/useAuth";
import { Navigate } from "react-router";
import React from 'react';
import '../../interview/styles/interview.scss';

const Protected = ({children}) => {
    const {user, loading} = useAuth()
    
    if (loading) {
        return (
          <div className="interview-page">
            <div className="fullpage-loader">
              <div className="loader-card">
                <div className="loader-ring">
                  <svg viewBox="0 0 60 60" className="loader-ring-svg">
                    <circle cx="30" cy="30" r="24" fill="none" stroke="rgba(212, 130, 26, 0.10)" strokeWidth="4" />
                    <circle cx="30" cy="30" r="24" fill="none" stroke="url(#auth-loader-grad)" strokeWidth="4" strokeDasharray="90 151" strokeLinecap="round" className="loader-ring-spin" />
                    <defs>
                      <linearGradient id="auth-loader-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#d4821a" />
                        <stop offset="50%" stopColor="#f0a040" />
                        <stop offset="100%" stopColor="#c8783a" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <span className="loader-icon">📡</span>
                </div>
                <h2 style={{ fontFamily: '"Playfair Display", serif', fontSize: '1.5rem', fontWeight: 700, color: '#e8e2d4', margin: '1.75rem 0 0.6rem' }}>
                  Waiting for server connection...
                </h2>
                <p style={{ fontSize: '0.9rem', color: '#a8a090', lineHeight: 1.75, margin: '0 0 1.5rem' }}>
                  Authenticating credentials and synchronizing with the mainframe.
                </p>
                <div className="loader-dots">
                  <span></span><span></span><span></span>
                </div>
              </div>
            </div>
          </div>
        )
    }
    
    if (!user) {
        return <Navigate to="/login" />
    }               
    
    return children
}

export default Protected;
