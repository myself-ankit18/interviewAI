import React, { useState, useRef } from 'react'
import {useInterview} from '../hooks/useInterview'
import {useAuth} from '../../auth/hooks/useAuth'
import { useNavigate } from 'react-router'
import '../styles/home.scss'

const Home = () => {
    const {loading, error, generateReport, reports} = useInterview()
    const {handleLogout, user} = useAuth()
    const [jobDescription, setJobDescription] = useState('')
    const [selfDescription, setSelfDescription] = useState('')
    const [selectedFile, setSelectedFile] = useState(null)
    const resumeInputRef = useRef(null)
    const navigate = useNavigate()

    const handleGenerateReport = async (e) => {
        e.preventDefault()
        const resumeFile = resumeInputRef.current.files[0]
        const data = await generateReport({resume: resumeFile, selfDescription, jobDescription})
        navigate(`/interview/${data._id}`)
    }

    const onLogout = async () => {
        await handleLogout()
        navigate('/login')
    }


  return (
    <div className="home-page">
      {/* Floating Orbs */}
      <div className="home-orb home-orb--1"></div>
      <div className="home-orb home-orb--2"></div>
      <div className="home-orb home-orb--3"></div>

      {/* Top Nav Bar */}
      <nav className="home-topbar">
        <div className="topbar-brand">
          <span className="brand-icon">✨</span>
          <span className="brand-text">InterviewGenie</span>
        </div>
        <div className="topbar-right">
          {user && <span className="topbar-greeting">Hey, {user.username || 'Legend'} 👋</span>}
          <button className="topbar-logout" onClick={onLogout}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            Logout
          </button>
        </div>
      </nav>

      <div className="home-content">
        {/* Hero */}
        <div className="home-hero">
          <div className="hero-badge">🧞‍♂️ AI-Powered Interview Prep</div>
          <h1 className="hero-title">
            Stop Stressing.<br/>
            <span className="hero-gradient">Start Slaying.</span>
          </h1>
          <p className="hero-subtitle">
            Upload your resume, paste the job description, and let our AI genie cook up the perfect interview battle plan. 
            <em> No lamp rubbing required.</em> 🪄
          </p>
        </div>

        {/* Form Card */}
        <div className="home-form-card">
          <div className="form-card-header">
            <h2>🎯 Generate Your Report</h2>
            <p>Fill in the details below and watch the magic happen</p>
          </div>

          <form className="home-form" onSubmit={handleGenerateReport}>
            {/* Job Description */}
            <div className="form-group">
              <label htmlFor="jobDescription">
                <span className="label-icon">📋</span>
                Job Description
                <span className="label-required">*</span>
              </label>
              <textarea
                id="jobDescription"
                name="jobDescription"
                rows={5}
                placeholder="Paste the job description here... We promise not to judge the requirements 😅"
                onChange={(e) => setJobDescription(e.target.value)}
                required
              />
            </div>

            {/* Resume Upload */}
            <div className="form-group">
              <label htmlFor="resume">
                <span className="label-icon">📄</span>
                Resume (PDF only, max 5MB)
                <span className="label-required">*</span>
              </label>
              <div className={`file-upload-zone ${selectedFile ? 'file-selected' : ''}`}>
                <input
                  type="file"
                  ref={resumeInputRef}
                  id="resume"
                  accept=".pdf"
                  className="file-input"
                  required
                  onChange={(e) => setSelectedFile(e.target.files[0] || null)}
                />
                <div className="file-upload-label">
                  {selectedFile ? (
                    <>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#00cec9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                      <span className="file-name">{selectedFile.name}</span>
                      <span className="file-size">{(selectedFile.size / 1024).toFixed(1)} KB</span>
                    </>
                  ) : (
                    <>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                      <span>Drag & drop or click to upload your resume</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Self Description */}
            <div className="form-group">
              <label htmlFor="selfDescription">
                <span className="label-icon">🙋</span>
                Tell Us About Yourself
                <span className="label-required">*</span>
              </label>
              <textarea
                id="selfDescription"
                name="selfDescription"
                rows={4}
                placeholder="Brag a little! Your experience, skills, career goals... We're all ears 👂"
                onChange={(e) => setSelfDescription(e.target.value)}
                required
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="form-error">
                <span>⚠️</span>
                <p>{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="home-submit-btn"
            >
              {loading ? (
                <span className="btn-loading">
                  <span className="btn-spinner"></span>
                  Genie is working its magic...
                </span>
              ) : (
                <>✨ Generate Interview Report</>
              )}
            </button>
          </form>
        </div>

        {/* Recent Reports - Table Style */}
        {reports && reports.length > 0 && (
          <div className="home-reports">
            <div className="reports-header">
              <h2>📊 Your Battle History</h2>
              <p>Previous interview reports — because legends keep track of their wins</p>
            </div>
            <div className="reports-table-wrap">
              <table className="reports-table">
                <thead>
                  <tr>
                    <th>Score</th>
                    <th>Job Title</th>
                    <th>Date</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {reports.map((report) => (
                    <tr key={report._id} onClick={() => navigate(`/interview/${report._id}`)}>
                      <td>
                        <span className={`table-score ${report.matchScore >= 80 ? 'score-high' : report.matchScore >= 60 ? 'score-good' : 'score-low'}`}>
                          {report.matchScore}%
                        </span>
                      </td>
                      <td className="table-title">{report.title}</td>
                      <td className="table-date">
                        {new Date(report.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td>
                        <span className={`table-badge ${report.matchScore >= 80 ? 'badge-high' : report.matchScore >= 60 ? 'badge-good' : 'badge-low'}`}>
                          {report.matchScore >= 80 ? '🔥 Hot Match' : report.matchScore >= 60 ? '💪 Solid' : '📈 Room to Grow'}
                        </span>
                      </td>
                      <td>
                        <span className="table-view-link">View →</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Home
