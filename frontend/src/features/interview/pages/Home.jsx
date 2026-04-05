import React, { useState, useRef } from 'react'
import {useInterview} from '../hooks/useInterview'
import {useAuth} from '../../auth/hooks/useAuth'
import { useNavigate } from 'react-router'
import '../styles/home.scss'
import { groqModels } from '../../../data/models.js'

const Home = () => {
    const {loading, error, generateReport, reports, deleteReport, setReports} = useInterview()
    const {handleLogout, user} = useAuth()
    const [jobDescription, setJobDescription] = useState('')
    const [selfDescription, setSelfDescription] = useState('')
    const [selectedFile, setSelectedFile] = useState(null)
    const [selectedModel, setSelectedModel] = useState('meta-llama/llama-4-scout-17b-16e-instruct')
    const [validationModal, setValidationModal] = useState({ open: false, reason: '' })
    const [modelErrorModal, setModelErrorModal] = useState({ open: false })
    const [searchQuery, setSearchQuery] = useState('')
    const [entriesToShow, setEntriesToShow] = useState('All')
    const resumeInputRef = useRef(null)
    const navigate = useNavigate()

    const availableModels = groqModels
        .filter(m => m.max_tokens >= 8000)
        .sort((a, b) => b.recommended - a.recommended);
    const handleDeleteReport = async (reportId) => {
        if(window.confirm("Are you sure you want to delete this report?")){
            const success = await deleteReport(reportId)
            if(success){
              setReports(reports.filter(r => r._id !== reportId))
            }
        }
    }
    const handleGenerateReport = async (e) => {
        e.preventDefault()
        const resumeFile = resumeInputRef.current.files[0]
        const data = await generateReport({
            resume: resumeFile, 
            selfDescription, 
            jobDescription, 
            aiModel: selectedModel
        })
        
        if (data && data.isValidationError) {
            setValidationModal({ open: true, reason: data.reason })
            return
        }

        if (data && data._id) {
            navigate(`/interview/${data._id}`)
        } else if (data === null) {
            setModelErrorModal({ open: true })
        }
    }

    const onLogout = async () => {
        await handleLogout()
        navigate('/login')
    }

    const filteredReports = reports ? reports.filter(r => {
        const query = searchQuery.toLowerCase()
        return (r.title && r.title.toLowerCase().includes(query)) || 
               (r.aiModel && r.aiModel.toLowerCase().includes(query)) ||
               (new Date(r.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toLowerCase().includes(query))
    }) : []

    const displayedReports = entriesToShow === 'All' ? filteredReports : filteredReports.slice(0, parseInt(entriesToShow, 10))

  return (
    <div className="home-page">
      {/* Validation Modal */}
      {validationModal.open && (
        <div className="validation-modal-overlay">
          <div className="validation-modal">
            <div className="modal-icon">⚠️</div>
            <h3>Signal Interrupted</h3>
            <p>Our AI detected some anomalies in your payload:</p>
            <div className="modal-reason">{validationModal.reason}</div>
            <button className="modal-close-btn" onClick={() => setValidationModal({ open: false, reason: '' })}>
              Recalibrate
            </button>
          </div>
        </div>
      )}

      {/* Model Error Modal */}
      {modelErrorModal.open && (
        <div className="validation-modal-overlay">
          <div className="validation-modal model-error-variant">
            <div className="modal-icon">🧠</div>
            <h3>Neural Net Overloaded</h3>
            <p>Our agents are currently processing at maximum capacity. The selected model is taking a breather.</p>
            <div className="modal-reason secondary">Switch frequencies to another model or wait a few minutes.</div>
            <button className="modal-close-btn" onClick={() => setModelErrorModal({ open: false })}>
              Switch frequencies
            </button>
          </div>
        </div>
      )}

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
          {user && <span className="topbar-greeting">Ready, {user.username || 'Operative'}? ⚡</span>}
          <button className="topbar-logout" onClick={onLogout}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            Logout
          </button>
        </div>
      </nav>

      <div className="home-content">
        {/* Hero */}
        <div className="home-hero">
          <div className="hero-badge">Next-Gen Interview Intelligence ⚡</div>
          <h1 className="hero-title">
            Outsmart the System.<br/>
            <span className="hero-gradient">Secure the Offer.</span>
          </h1>
          <p className="hero-subtitle">
            Feed the algorithm your resume and the target role. We'll synthesize a tactical briefing built to win. 🎯
          </p>
        </div>

        {/* Form Card */}
        <div className="home-form-card">
          <div className="form-card-header">
            <h2>Initialize Strategy Session 🔬</h2>
            <p>Configure your parameters to generate a custom tactical report</p>
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
                placeholder="Drop the job spec here. We'll decode the corporate jargon. 🕵️"
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
                Tell Us About Yourself (Optional)
              </label>
              <textarea
                id="selfDescription"
                name="selfDescription"
                rows={4}
                placeholder="Any secret weapons? Add context to supercharge the AI's accuracy... (Optional) 🚀"
                onChange={(e) => setSelfDescription(e.target.value)}
              />
            </div>

            {/* AI Model Selection */}
            <div className="form-group">
              <label htmlFor="aiModel">
                <span className="label-icon">🧠</span>
                Choose AI Model (Agent)
                <span className="label-required">*</span>
              </label>
              <div className="model-select-wrapper">
                <select 
                  id="aiModel" 
                  value={selectedModel} 
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="model-select"
                >
                  {availableModels.map((model) => (
                      <option 
                        key={model.id} 
                        value={model.id} 
                      >
                        {model.recommended ? '⭐ ' : ''}{model.name} {model.developer ? `(${model.developer})` : ''}
                      </option>
                  ))}
                </select>
              </div>
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
                  <span>Synthesizing tactical brief...</span>
                </span>
              ) : (
                <span>Generate Strategy ⚡</span>
              )}
            </button>
          </form>
        </div>

        {/* Recent Reports - Table Style */}
        {reports && reports.length > 0 && (
          <div className="home-reports">
            <div className="reports-header">
              <div className="reports-header-text">
                <h2>Mission Logs 🗄️</h2>
                <p>Archive of your past tactical briefings and strategies</p>
              </div>
              <div className="reports-controls">
                <div className="search-wrapper">
                    <span className="search-icon">🔍</span>
                    <input 
                        type="text" 
                        placeholder="Search title, model..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="table-search"
                    />
                </div>
                <div className="limit-wrapper">
                    <select 
                        value={entriesToShow} 
                        onChange={(e) => setEntriesToShow(e.target.value)}
                        className="table-limit-select"
                    >
                        {reports.length > 3 && <option value="3">Show 3</option>}
                        {reports.length > 5 && <option value="5">Show 5</option>}
                        {reports.length > 10 && <option value="10">Show 10</option>}
                        <option value="All">Show All ({reports.length})</option>
                    </select>
                </div>
              </div>
            </div>
            <div className="reports-table-wrap">
              <table className="reports-table">
                <thead>
                  <tr>
                    <th>Score</th>
                    <th>Job Title</th>
                    <th>AI Model</th>
                    <th>Date</th>
                    <th></th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {displayedReports.length > 0 ? displayedReports.map((report) => (
                    <tr key={report._id}>
                      <td>
                        <span className={`table-score ${report.matchScore >= 80 ? 'score-high' : report.matchScore >= 60 ? 'score-good' : 'score-low'}`}>
                          {report.matchScore}%
                        </span>
                      </td>
                      <td className="table-title">{report.title}</td>
                      <td className="table-model">
                        <span className="model-badge">{(report.aiModel || 'meta-llama/llama-4-scout-17b-16e-instruct').split('/').pop()}</span>
                      </td>
                      <td className="table-date">
                        {new Date(report.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td>
                        <span onClick={() => navigate(`/interview/${report._id}`)}  className="table-view-link">View</span>
                      </td>
                      <td>
                        <span onClick={() => handleDeleteReport(report._id)} className="table-delete-link">Delete</span>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan="5" className="table-empty-state">No reports found matching your search.</td>
                    </tr>
                  )}
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
