import React, { useState , useEffect} from 'react'
import '../styles/interview.scss'
import { useParams, useNavigate } from 'react-router'
import { useInterview } from '../hooks/useInterview'
import { useAuth } from '../../auth/hooks/useAuth'
import { groqModels } from '../../../data/models.js'

const Interview = () => {
  const [activeTab, setActiveTab] = useState('technical')
  const [projectIdeas, setProjectIdeas] = useState(null)
  const [projectLoading, setProjectLoading] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const { interviewId } = useParams()
  const navigate = useNavigate()
  const { report, loading, pdfLoading, error, setError, getReportByID, getResumePDF, getProjectIdeasForReport, getFullReportPDF, cancelPdfGeneration } = useInterview()
  const { handleLogout, user } = useAuth()

  const [showDownloadModal, setShowDownloadModal] = useState(false)
  const [selectedModel, setSelectedModel] = useState('meta-llama/llama-4-scout-17b-16e-instruct')
  const [unavailableModels, setUnavailableModels] = useState([])
  
  const availableModels = groqModels
      .filter(m => m.max_tokens >= 8000)
      .sort((a, b) => b.recommended - a.recommended);

    useEffect(() => {
        if (interviewId) {
            getReportByID(interviewId)
        }
    }, [interviewId])

  const onLogout = async () => {
    await handleLogout()
    navigate('/login')
  }

  const handleTabChange = (tabId) => {
    setActiveTab(tabId)
    setIsMobileMenuOpen(false)
  }

  const handleGetProjectIdeas = async () => {
    handleTabChange('projects')
    if (projectIdeas) return // Already loaded
    setProjectLoading(true)
    const data = await getProjectIdeasForReport(interviewId)
    setProjectIdeas(data)
    setProjectLoading(false)
  }

  const handleDownloadSubmit = async () => {
      const data = await getResumePDF(interviewId, selectedModel);
      if (!data) {
          if (!unavailableModels.includes(selectedModel)) {
              setUnavailableModels(prev => [...prev, selectedModel])
          }
      } else {
          setShowDownloadModal(false);
      }
  }

  // Show loading state if report is not loaded yet
  if (loading) {
    return (
      <div className="interview-page">
        <div className="fullpage-loader">
          <div className="loader-card">
            <div className="loader-ring">
              <svg viewBox="0 0 60 60" className="loader-ring-svg">
                <circle cx="30" cy="30" r="24" fill="none" stroke="rgba(108,92,231,0.10)" strokeWidth="4" />
                <circle cx="30" cy="30" r="24" fill="none" stroke="url(#loader-grad)" strokeWidth="4" strokeDasharray="90 151" strokeLinecap="round" className="loader-ring-spin" />
                <defs>
                  <linearGradient id="loader-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#6c5ce7" />
                    <stop offset="50%" stopColor="#a29bfe" />
                    <stop offset="100%" stopColor="#00cec9" />
                  </linearGradient>
                </defs>
              </svg>
              <span className="loader-icon">📊</span>
            </div>
            <h2>Decoding Profile Geometry...</h2>
            <p>Our neural engines are mapping your skills against the target requirements. Expect intel in 15-30 seconds. ⏳</p>
            <div className="loader-steps">
              <div className="loader-step active"><span>📄</span> Reading Resume</div>
              <div className="loader-step"><span>🔍</span> Matching Skills</div>
              <div className="loader-step"><span>🧠</span> Generating Questions</div>
              <div className="loader-step"><span>📋</span> Building Plan</div>
            </div>
            <div className="loader-dots">
              <span></span><span></span><span></span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Show error state if there's an error
  if (error) {
    return (
      <div className="interview-page">
        <div className="fullpage-loader">
          <div className="loader-card" style={{position: 'relative'}}>
            <button 
              onClick={() => setError('')}
              style={{
                position: 'absolute', 
                top: '1rem', 
                right: '1.25rem', 
                background: 'transparent', 
                border: 'none', 
                color: '#a8a090', 
                fontSize: '1.5rem', 
                cursor: 'pointer',
                transition: 'color 0.2s ease'
              }}
              onMouseEnter={(e) => e.target.style.color = '#fff'}
              onMouseLeave={(e) => e.target.style.color = '#a8a090'}
              aria-label="Close error"
            >
              &#x2715;
            </button>
            <div className="error-message">
              <h3>Oops! Something went wrong 😵</h3>
              <p>{error}</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Show empty state if report is null
  if (!report) {
    return (
      <div className="interview-page">
        <div className="fullpage-loader">
          <div className="loader-card">
            <div className="empty-state">
              <h3>Data Vault Empty 📭</h3>
              <p>No intel found. Initiate a new strategy session to populate your dashboard.</p>
              <button className="topbar-back" onClick={() => navigate('/')} style={{marginTop: '1rem'}}>← Back to Dashboard</button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const renderContent = () => {
    if (activeTab === 'technical') {
      return (
        <div className="content-section">
          <h2>⚙️ Technical Interrogation</h2>
          <p className="section-subtitle">High-probability technical challenges, complete with optimized countermeasures.</p>
          <div className="questions-list">
            {report.technicalQuestions?.map((q, idx) => (
              <div key={idx} className="question-card">
                <div className="question-header">
                  <span className="question-number">Q{idx + 1}</span>
                  <h3>{q.question}</h3>
                </div>
                <div className="question-detail">
                  <p className="intention"><strong>Why they ask this:</strong> {q.intention}</p>
                  <p className="answer"><strong>Your power answer:</strong> {q.answer}</p>
                </div>
              </div>
            )) || <p>No technical questions available</p>}
          </div>
        </div>
      )
    } else if (activeTab === 'behavioral') {
      return (
        <div className="content-section">
          <h2>💬 Behavioral Analytics</h2>
          <p className="section-subtitle">Navigating the psychological minefield with structural, high-impact narratives.</p>
          <div className="questions-list">
            {report.behavioralQuestions?.map((q, idx) => (
              <div key={idx} className="question-card">
                <div className="question-header">
                  <span className="question-number">Q{idx + 1}</span>
                  <h3>{q.question}</h3>
                </div>
                <div className="question-detail">
                  <p className="intention"><strong>Why they ask this:</strong> {q.intention}</p>
                  <p className="answer"><strong>Your power answer:</strong> {q.answer}</p>
                </div>
              </div>
            )) || <p>No behavioral questions available</p>}
          </div>
        </div>
      )
    } else if (activeTab === 'plan') {
      return (
        <div className="content-section">
          <h2>📋 Tactical Execution Timeline</h2>
          <p className="section-subtitle">Your calibrated day-by-day roadmap to peak interview readiness.</p>
          <div className="plan-timeline">
            {report.preparationPlan?.map((day, idx) => (
              <div key={idx} className="day-card">
                <div className="day-header">
                  <span className="day-number">Day {day.day}</span>
                  <h3>{day.focus}</h3>
                </div>
                <ul className="tasks-list">
                  {day.tasks?.map((task, tidx) => (
                    <li key={tidx}>{task}</li>
                  )) || <li>No tasks available</li>}
                </ul>
              </div>
            )) || <p>No preparation plan available</p>}
          </div>
        </div>
      )
    } else if (activeTab === 'analysis') {
      const highlightText = (text, matches) => {
        if (!matches || matches.length === 0) return text;
        
        // Escape special characters and join with OR, but match whole phrases/words
        const pattern = matches
          .map(m => m.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'))
          .sort((a, b) => b.length - a.length) // Match longer phrases first
          .join('|');
          
        const regex = new RegExp(`(${pattern})`, 'gi');
        const parts = text.split(regex);

        return parts.map((part, i) => 
          regex.test(part) ? <mark key={i} className="highlight-match">{part}</mark> : part
        );
      };

      if (!report.resumeAnalysis) {
        return (
          <div className="content-section">
            <h2>🔍 Resume Strategic Analysis</h2>
            <div className="legacy-analysis-notice">
              <div className="notice-icon">📜</div>
              <h3>Legacy Report Detected</h3>
              <p>This report was generated before the Resume Heatmap feature was activated. Create a new report to see a detailed keyword match analysis and ATS-style highlighting!</p>
              <button className="home-submit-btn" onClick={() => navigate('/')} style={{marginTop: '1.5rem', padding: '0.8rem 2rem'}}>
                <span>New Strategy Session</span>
              </button>
            </div>
          </div>
        );
      }

      return (
        <div className="content-section">
          <h2>🔍 Resume Strategic Analysis</h2>
          <p className="section-subtitle">A deep dive into your profile's alignment with the role using ATS-style keyword heuristics</p>

          <div className="resume-heatmap-container">
            <div className="heatmap-main">
              <div className="heatmap-resume-display">
                {highlightText(report.resume, report.resumeAnalysis?.matchedKeywords)}
              </div>
            </div>

            <div className="heatmap-sidebar">
              <div className="heatmap-legend">
                <h4>Legend</h4>
                <div className="legend-item">
                  <span className="dot dot-match"></span>
                  <span>Direct Keyword Match</span>
                </div>
                <div className="legend-item">
                  <span className="dot dot-missing"></span>
                  <span>Missing Requirement</span>
                </div>
              </div>

              <div className="missing-keywords-card">
                <h4>⚠️ Missing Critical Keywords</h4>
                {report.resumeAnalysis.missingKeywords?.length > 0 ? (
                  <div className="keyword-gaps">
                    {report.resumeAnalysis.missingKeywords.map((kw, i) => (
                      <span key={i} className="keyword-gap-tag">{kw}</span>
                    ))}
                  </div>
                ) : (
                  <div className="perfect-match-state">
                    <span className="perfect-icon">✨</span>
                    <p>No critical gaps found! Your resume alignment is exceptional for this role.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      );
    } else if (activeTab === 'projects') {
      return (
        <div className="content-section">
          <h2>🚀 Strategic Portfolio Expansion</h2>
          <p className="section-subtitle">Targeted builds designed to neutralize your identified skill vulnerabilities.</p>
          
          {projectLoading ? (
            <div className="projects-loading">
              <div className="loader-ring" style={{width: '60px', height: '60px', margin: '2rem auto'}}>
                <svg viewBox="0 0 60 60" className="loader-ring-svg">
                  <circle cx="30" cy="30" r="24" fill="none" stroke="rgba(108,92,231,0.10)" strokeWidth="4" />
                  <circle cx="30" cy="30" r="24" fill="none" stroke="url(#proj-grad)" strokeWidth="4" strokeDasharray="90 151" strokeLinecap="round" className="loader-ring-spin" />
                  <defs>
                    <linearGradient id="proj-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#6c5ce7" />
                      <stop offset="100%" stopColor="#00cec9" />
                    </linearGradient>
                  </defs>
                </svg>
                <span className="loader-icon">💡</span>
              </div>
              <p style={{textAlign: 'center', color: '#9b96c7'}}>Our AI is brainstorming project ideas based on your skill gaps...</p>
            </div>
          ) : projectIdeas?.projects ? (
            <div className="projects-list">
              {projectIdeas.projects.map((project, idx) => (
                <div key={idx} className="project-card">
                  <div className="project-card-header">
                    <div className="project-number">{idx + 1}</div>
                    <div className="project-meta">
                      <h3>{project.title}</h3>
                      <div className="project-badges">
                        <span className={`difficulty-badge diff-${project.difficulty?.toLowerCase()}`}>{project.difficulty}</span>
                        <span className="time-badge">⏱ {project.estimatedTime}</span>
                      </div>
                    </div>
                  </div>
                  <p className="project-description">{project.description}</p>
                  
                  <div className="project-section">
                    <h4>🛠 Tech Stack</h4>
                    <div className="project-tech-tags">
                      {project.techStack?.map((tech, tidx) => (
                        <span key={tidx} className="tech-tag">{tech}</span>
                      ))}
                    </div>
                  </div>

                  <div className="project-section">
                    <h4>🎯 Skills You'll Learn</h4>
                    <div className="project-tech-tags">
                      {project.skillsCovered?.map((skill, sidx) => (
                        <span key={sidx} className="skill-covered-tag">{skill}</span>
                      ))}
                    </div>
                  </div>

                  <div className="project-section">
                    <h4>✨ Key Features to Build</h4>
                    <ul className="project-features">
                      {project.keyFeatures?.map((feat, fidx) => (
                        <li key={fidx}>{feat}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="project-impress">
                    <span className="impress-icon">💎</span>
                    <p><strong>Why it impresses:</strong> {project.whyItImpresses}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <p>Could not generate project ideas. Please try again later.</p>
            </div>
          )}
        </div>
      )
    }
  }

  const renderNavItems = (isMobile = false) => (
    <nav className={`sidebar-nav ${isMobile ? 'mobile-nav' : 'desktop-nav'} ${isMobileMenuOpen && isMobile ? 'open' : ''}`}>
      <button
        className={`nav-item ${activeTab === 'technical' ? 'active' : ''}`}
        onClick={() => handleTabChange('technical')}
      >
        <span className="nav-icon">⚙️</span>
        Technical Q's
      </button>
      <button
        className={`nav-item ${activeTab === 'behavioral' ? 'active' : ''}`}
        onClick={() => handleTabChange('behavioral')}
      >
        <span className="nav-icon">💬</span>
        Behavioral Q's
      </button>
      <button
        className={`nav-item ${activeTab === 'plan' ? 'active' : ''}`}
        onClick={() => handleTabChange('plan')}
      >
        <span className="nav-icon">📋</span>
        Battle Plan
      </button>
      <button
        className={`nav-item ${activeTab === 'projects' ? 'active' : ''}`}
        onClick={handleGetProjectIdeas}
      >
        <span className="nav-icon">🚀</span>
        Project Ideas
      </button>
      <button
        className={`nav-item ${activeTab === 'analysis' ? 'active' : ''}`}
        onClick={() => handleTabChange('analysis')}
      >
        <span className="nav-icon">🔍</span>
        Resume Analysis
      </button>
      <button className="nav-item nav-item--download" onClick={()=>{
        setShowDownloadModal(true);
        setIsMobileMenuOpen(false);
      }}>
        <span className="nav-icon">📄</span>
        Generate AI Improved Resume
      </button>
      <button className="nav-item nav-item--download-report" onClick={() => getFullReportPDF(interviewId)} disabled={pdfLoading}>
        <span className="nav-icon">📊</span>
        Download Whole Report
      </button>
    </nav>
  )

  return (
    <div className="interview-page">
      {/* Top Navigation */}
      <nav className="interview-topbar">
        <button className="topbar-back" onClick={() => navigate('/')}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
          Back to Dashboard
        </button>
        <div className="topbar-actions">
          {user && <span className="topbar-user">👤 {user.username || 'User'}</span>}
          <button className="topbar-logout" onClick={onLogout}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            Logout
          </button>
          
          <button 
            className={`mobile-menu-btn ${isMobileMenuOpen ? 'open' : ''}`}
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle Menu"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
      </nav>

      {/* Mobile Menu Dropdown (Outside scrolling/transform contexts) */}
      {renderNavItems(true)}

      {/* PDF Generation Overlay */}
      {pdfLoading && (
        <div className="pdf-overlay">
          <div className="pdf-overlay-card">
            <div className="pdf-anim-ring">
              <svg viewBox="0 0 50 50" className="pdf-ring-svg">
                <circle cx="25" cy="25" r="20" fill="none" stroke="rgba(108,92,231,0.15)" strokeWidth="3" />
                <circle cx="25" cy="25" r="20" fill="none" stroke="url(#pdf-grad)" strokeWidth="3" strokeDasharray="80 126" strokeLinecap="round" className="pdf-ring-spin" />
                <defs>
                  <linearGradient id="pdf-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#6c5ce7" />
                    <stop offset="50%" stopColor="#a29bfe" />
                    <stop offset="100%" stopColor="#00cec9" />
                  </linearGradient>
                </defs>
              </svg>
              <span className="pdf-anim-icon">📄</span>
            </div>
            <h3>Compiling Executive Dossier...</h3>
            <p>Forging your strategy into a comprehensive tactical brief. ⚡</p>
            <div className="pdf-progress-dots">
              <span></span><span></span><span></span>
            </div>
            <button className="pdf-cancel-btn" onClick={cancelPdfGeneration}>
              Cancel Generation
            </button>
          </div>
        </div>
      )}

      {/* Model Selection Modal for Download */}
      {showDownloadModal && (
        <div className="pdf-overlay" style={{ zIndex: 1000}}>
          <div className="pdf-overlay-card model-select-modal" style={{textAlign: "left"}}>
            <h3 style={{marginBottom: "0.5rem", fontSize: "1.5rem", background: "linear-gradient(45deg, #00cec9, #6c5ce7)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent"}}>Download Enhanced Resume</h3>
            <p style={{marginBottom: "1.5rem", color: "#a29bfe", fontSize: "0.95rem"}}>Choose an AI model to professionally rewrite and enhance your resume text before exporting to PDF.</p>
            
            <div className="form-group">
              <label htmlFor="aiModelDownload" style={{display: "block", marginBottom: "0.5rem", fontWeight: "600", color: "#eef2f3"}}>
                <span className="label-icon" style={{marginRight: "8px"}}>🧠</span>
                Select AI Agent
              </label>
              <div className="model-select-wrapper" style={{position: "relative"}}>
                <select 
                  id="aiModelDownload" 
                  value={selectedModel} 
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="model-select"
                  style={{width: "100%", padding: "12px", borderRadius: "12px", background: "rgba(10, 11, 26, 0.6)", border: "1px solid rgba(108, 92, 231, 0.3)", color: "white", outline: "none"}}
                >
                  {availableModels.map((model) => {
                    const isUnavailable = unavailableModels.includes(model.id);
                    return (
                      <option 
                        key={model.id} 
                        value={model.id} 
                        disabled={isUnavailable}
                      >
                        {model.recommended ? '⭐ ' : ''}{model.name} {model.developer ? `(${model.developer})` : ''} {isUnavailable ? '- Unavailable / Out of Credits' : ''}
                      </option>
                    )
                  })}
                </select>
              </div>
            </div>
            
            <div style={{display: "flex", gap: "1rem", marginTop: "2rem"}}>
              <button 
                onClick={() => setShowDownloadModal(false)}
                style={{flex: 1, padding: "12px", borderRadius: "10px", background: "transparent", border: "1px solid rgba(255, 255, 255, 0.1)", color: "white", cursor: "pointer"}}
              >
                Cancel
              </button>
              <button 
                 onClick={handleDownloadSubmit}
                 disabled={pdfLoading}
                 style={{flex: 1, padding: "12px", borderRadius: "10px", background: "linear-gradient(45deg, #6c5ce7, #00cec9)", border: "none", color: "white", fontWeight: "bold", cursor: "pointer", display: "flex", justifyContent: "center", alignItems: "center", gap: "8px"}}
              >
                {pdfLoading ? (
                  <>Building...</>
                ) : (
                  <>📥 Download PDF</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="interview-container">
        {/* Sidebar */}
        <div className="interview-sidebar">
          <div className="sidebar-header">
            <div className="sidebar-header-top">
              <h2>🎯 Interview Report</h2>
            </div>
            <div className={`match-badge ${!isMobileMenuOpen ? 'always-show' : 'hide-on-mobile'}`}>
              <div className="match-score-ring">
                <svg viewBox="0 0 36 36" className="match-ring-svg">
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="rgba(108, 92, 231, 0.12)"
                    strokeWidth="3"
                  />
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke={report.matchScore >= 80 ? '#00cec9' : report.matchScore >= 60 ? '#feca57' : '#ff6b6b'}
                    strokeWidth="3"
                    strokeDasharray={`${report.matchScore || 0}, 100`}
                    strokeLinecap="round"
                  />
                </svg>
                <span className="match-score-value">{report.matchScore || 0}%</span>
              </div>
              <p>Match Score</p>
              <span className="match-verdict">
                {(report.matchScore || 0) >= 80 ? "Elite Alignment 💎" : (report.matchScore || 0) >= 60 ? 'Tactical Advantage 🛡️' : 'Calibration Required 🔧'}
              </span>
            </div>
          </div>

          {renderNavItems(false)}
        </div>

        {/* Main Content Area */}
        <div className="interview-main">
          {/* Skill Gaps Header */}
          <div className="skill-gaps-header">
            <div className="skill-gaps-container">
              <h3>🎯 Vulnerability Assessment</h3>
              <p className="skill-gaps-subtitle">Critical capability gaps to bridge before deployment.</p>
              <div className="skill-filters">
                {report.skillGaps?.map((gap, idx) => (
                  <button
                    key={idx}
                    className={`skill-tag severity-${gap.severity?.toLowerCase() || 'low'}`}
                    title={`${gap.skill} - ${gap.severity || 'Unknown'} severity`}
                  >
                    {gap.skill}
                  </button>
                )) || <p>Zero vulnerabilities detected. You are a tactical anomaly. 🦄</p>}
              </div>
            </div>
          </div>

          {/* Content Area */}
          <div className="interview-content">
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Interview
