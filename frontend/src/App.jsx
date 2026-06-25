import React, { useState } from 'react';
import { useCivicFix, formatGen } from './useCivicFix';
import {
  HardHat,
  Wrench,
  Terminal,
  ExternalLink,
  AlertTriangle,
  Globe,
  RefreshCw,
  Wallet,
  CheckCircle2,
  XCircle,
  HelpCircle,
  FileText,
  DollarSign
} from 'lucide-react';

const PRESET_CONTRACTOR = "0x9999999999999999999999999999999999999999";

const PRESETS = [
  {
    name: "Preset 1: Block A Pothole Repair (SATISFIED)",
    url: "https://nextdoor.com/g/pothole-repair-block-a-satisfaction",
    scope: "Repave the massive potholes at the entrance of Block A to ensure vehicles can safely transit.",
    mockDescription: "Scraped text contains comments like: 'Looks great!', 'Finally repaved, no more tire damage!', 'Fast work, very satisfied', 'Safe now!'.",
    outcome: "Satisfied"
  },
  {
    name: "Preset 2: Playground Swings Fix (UNSATISFIED)",
    url: "https://nextdoor.com/g/playground-swings-rust-hazard",
    scope: "Replace rusty chains and broken swings at the neighborhood playground.",
    mockDescription: "Scraped text contains comments like: 'They left rusty bolts in the grass!', 'Dangerous for children', 'sloppy job', 'Only half the swings are fixed.'.",
    outcome: "Unsatisfied"
  },
  {
    name: "Preset 3: Empty Discussion Thread (FAILED)",
    url: "https://nextdoor.com/g/empty-discussion-thread",
    scope: "Install new municipal benches near the central community park.",
    mockDescription: "Scraped text is completely empty or unresponsive. AI throws an error for insufficient data.",
    outcome: "Scrape Failed"
  }
];

function App() {
  const {
    address,
    projects,
    contractBalance,
    loading,
    error,
    txHash,
    txStatus,
    connectWallet,
    fetchProjectsState,
    createProject,
    auditProjectSatisfaction,
    contractAddress
  } = useCivicFix();

  // Form States
  const [scope, setScope] = useState('');
  const [contractor, setContractor] = useState(PRESET_CONTRACTOR);
  const [funding, setFunding] = useState('10');
  const [forumUrl, setForumUrl] = useState('');
  const [activeAuditProjectId, setActiveAuditProjectId] = useState(null);

  // Terminal Console Logs
  const [logs, setLogs] = useState([
    "System booted. Urban Planning Terminal online.",
    "Awaiting GenLayer blockchain connection..."
  ]);
  const [logsExpanded, setLogsExpanded] = useState(false);

  const addLog = (msg) => {
    const time = new Date().toLocaleTimeString();
    setLogs(prev => [`[${time}] ${msg}`, ...prev]);
  };

  const handleConnect = async () => {
    addLog("Initiating wallet connection...");
    await connectWallet();
    addLog("Wallet connection processed.");
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!scope.strip || !scope.trim()) {
      addLog("ERROR: Project scope cannot be empty.");
      return;
    }
    if (!contractor.strip || !contractor.trim()) {
      addLog("ERROR: Contractor wallet cannot be empty.");
      return;
    }
    if (Number(funding) <= 0) {
      addLog("ERROR: Funding must be positive.");
      return;
    }

    try {
      addLog(`Creating project escrow with ${funding} GEN...`);
      await createProject(contractor, scope, funding);
      addLog("Project escrow created successfully!");
      setScope('');
    } catch (err) {
      addLog(`ERROR creating project: ${err.message}`);
    }
  };

  const handleAudit = async (projectId, submittedUrl) => {
    if (!submittedUrl || !submittedUrl.trim()) {
      addLog(`ERROR: Forum URL cannot be empty for project #${projectId}`);
      return;
    }
    try {
      addLog(`Starting citizen satisfaction audit on project #${projectId}...`);
      await auditProjectSatisfaction(projectId, submittedUrl);
      addLog(`Audit completed for project #${projectId}. Escrow state updated.`);
    } catch (err) {
      addLog(`ERROR running audit: ${err.message}`);
    }
  };

  const applyPreset = (preset) => {
    setScope(preset.scope);
    setForumUrl(preset.url);
    addLog(`Applied Preset: ${preset.name}`);
  };

  return (
    <div className="app-wrapper">
      {/* Caution stripes top banner */}
      <div className="caution-stripes"></div>

      {/* Header */}
      <header className="dashboard-header">
        <div className="header-branding">
          <HardHat className="header-logo-icon" />
          <div>
            <h1 className="header-title-text">CIVICFIX CROWDFUND</h1>
            <p className="header-subtitle-text">
              Decentralized Public Works & Citizen Satisfaction Escrow
            </p>
          </div>
        </div>

        <div className="header-status-panel">
          {contractAddress ? (
            <div className="status-badge">
              <span className="badge-label">CONTRACT:</span>
              <span className="badge-val">{contractAddress.slice(0, 6)}...{contractAddress.slice(-4)}</span>
            </div>
          ) : (
            <div className="status-badge" style={{ borderColor: 'var(--color-red)', color: 'var(--color-red)' }}>
              NO CONTRACT DEPLOYED
            </div>
          )}

          <div className="status-badge">
            <span className="badge-label">ESCROW POOL:</span>
            <span className="badge-val val-green">{formatGen(contractBalance)} GEN</span>
          </div>

          {address ? (
            <div className="status-badge" style={{ borderColor: 'var(--color-blue)', color: 'var(--color-blue)' }}>
              <Wallet style={{ width: '14px', height: '14px', marginRight: '4px' }} />
              <span>{address.slice(0, 6)}...{address.slice(-4)}</span>
            </div>
          ) : (
            <button onClick={handleConnect} className="btn-connect-wallet" disabled={loading}>
              CONNECT WALLET
            </button>
          )}
        </div>
      </header>

      {/* Main Grid Content */}
      <main className="dashboard-grid">
        
        {/* Left Column: Preset Test Center & Escrow Deploy Form */}
        <div className="grid-col">
          
          {/* Panel: Presets */}
          <div className="panel-card yellow-theme">
            <div className="panel-card-header">
              <span>MUNICIPAL AUDIT PRESET TEST DATA</span>
              <HelpCircle style={{ width: '16px', height: '16px', color: 'var(--color-yellow)' }} />
            </div>
            <div className="panel-card-body">
              <div className="preset-list">
                {PRESETS.map((preset, idx) => (
                  <div key={idx} className="preset-item">
                    <div className="preset-item-header">
                      <span className="preset-title">{preset.name.split(':')[0]}</span>
                      <span className={`preset-badge ${
                        preset.outcome === "Satisfied" ? "satisfied" :
                        preset.outcome === "Unsatisfied" ? "unsatisfied" : "failed"
                      }`}>
                        {preset.outcome}
                      </span>
                    </div>
                    <p className="preset-description">
                      <strong>Scope:</strong> {preset.scope}
                    </p>
                    <div className="preset-mock-info">
                      <strong>Scrape Simulation:</strong> {preset.mockDescription}
                    </div>
                    <button
                      type="button"
                      onClick={() => applyPreset(preset)}
                      className="btn-apply-preset"
                    >
                      <Wrench style={{ width: '12px', height: '12px' }} /> Apply Preset Data
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Panel: Create Project Escrow */}
          <div className="panel-card orange-theme">
            <div className="panel-card-header">
              <span>INITIALIZE PUBLIC WORKS ESCROW POOL</span>
              <DollarSign style={{ width: '16px', height: '16px', color: 'var(--color-orange)' }} />
            </div>
            <form onSubmit={handleCreateProject} className="panel-card-body">
              <div className="form-group">
                <label className="form-group-label">PROJECT SCOPE DESCRIPTION</label>
                <textarea
                  className="input-municipal"
                  placeholder="Describe the repair job in detail (e.g. repave the entrance of block A, replace park swings)..."
                  value={scope}
                  onChange={(e) => setScope(e.target.value)}
                />
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label className="form-group-label">CONTRACTOR ADDRESS</label>
                  <input
                    type="text"
                    className="input-municipal"
                    placeholder="0x..."
                    value={contractor}
                    onChange={(e) => setContractor(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-group-label">ESCROW FUNDING AMOUNT (GEN)</label>
                  <input
                    type="number"
                    step="any"
                    className="input-municipal"
                    placeholder="10"
                    value={funding}
                    onChange={(e) => setFunding(e.target.value)}
                  />
                </div>
              </div>

              <button
                type="submit"
                className="btn-municipal"
                disabled={loading || !address}
              >
                {loading ? (
                  <RefreshCw style={{ width: '16px', height: '16px' }} className="animate-spin" />
                ) : (
                  <>
                    <HardHat style={{ width: '16px', height: '16px' }} />
                    <span>DEPLOY PROJECT ESCROW</span>
                  </>
                )}
              </button>

              {!address && (
                <p style={{ color: 'var(--color-red)', fontSize: '11px', textAlign: 'center', marginTop: '10px', fontFamily: 'var(--font-mono)' }}>
                  * Connect wallet to deploy public works escrow pool.
                </p>
              )}
            </form>
          </div>

        </div>

        {/* Right Column: Active Escrow Panels */}
        <div className="grid-col">
          
          <div className="panel-card blue-theme">
            <div className="panel-card-header">
              <span>ACTIVE PUBLIC WORKS ESCROWS & SENTIMENT AUDITING</span>
              <Globe style={{ width: '16px', height: '16px', color: 'var(--color-blue)' }} />
            </div>
            
            <div className="panel-card-body" style={{ minHeight: '400px' }}>
              <div className="project-list-container">
                {projects.length === 0 ? (
                  <div className="empty-state">
                    <HardHat className="empty-state-icon" />
                    <div className="empty-state-title">NO ACTIVE ESCROWS FOUND</div>
                    <div className="empty-state-sub">Create an escrow or connect to studionet to view projects.</div>
                  </div>
                ) : (
                  projects.map((proj) => (
                    <div key={proj.id} className={`project-card ${proj.status === 'APPROVED' ? 'approved' : ''}`}>
                      
                      {/* Stamp overlay */}
                      {proj.status === 'APPROVED' && (
                        <div style={{ position: 'absolute', top: '15px', right: '15px', zIndex: 10 }}>
                          <div className="municipal-stamp">
                            COMMUNITY APPROVED
                          </div>
                        </div>
                      )}

                      <div className="project-card-header">
                        <div>
                          <span className="project-badge-id">PROJECT ID #{proj.id}</span>
                          <span className="project-address-contractor" style={{ marginLeft: '10px' }}>
                            Contractor: {proj.contractor.slice(0, 6)}...{proj.contractor.slice(-4)}
                          </span>
                        </div>
                        <div className="project-amount-locked">
                          {formatGen(proj.amount)} GEN
                        </div>
                      </div>

                      <div className="project-scope-container">
                        <div className="project-scope-label">Specified Project Scope:</div>
                        <div className="project-scope-text">
                          {proj.scope}
                        </div>
                      </div>

                      {/* URL Submission Form */}
                      {proj.status === 'ACTIVE' && (
                        <div className="forum-submission-box">
                          <div className="forum-submission-title">
                            <Terminal style={{ width: '14px', height: '14px', color: 'var(--color-yellow)' }} />
                            <span>SUBMIT CITIZEN SATISFACTION FORUM DISCUSSION LINK</span>
                          </div>
                          <div className="forum-input-row">
                            <input
                              type="text"
                              className="input-municipal"
                              placeholder="https://nextdoor.com/g/thread-id..."
                              value={activeAuditProjectId === proj.id ? forumUrl : ''}
                              onChange={(e) => {
                                setActiveAuditProjectId(proj.id);
                                setForumUrl(e.target.value);
                              }}
                            />
                            <button
                              type="button"
                              className="btn-municipal"
                              disabled={loading || !address}
                              onClick={() => handleAudit(proj.id, forumUrl)}
                            >
                              RUN AUDIT
                            </button>
                          </div>
                          {!address && (
                            <p style={{ color: 'var(--color-red)', fontSize: '10px', marginTop: '6px', fontFamily: 'var(--font-mono)' }}>
                              * Wallet connection required to run AI audits.
                            </p>
                          )}
                        </div>
                      )}

                      {/* Audit Results Section */}
                      {proj.forum_url && (
                        <div className="audit-results-box">
                          <div className="gauge-header">
                            <span className="gauge-label">NEIGHBORHOOD SENTIMENT GAUGE</span>
                            <span className="gauge-score" style={{ color: proj.is_satisfied ? 'var(--color-green)' : 'var(--color-orange)' }}>
                              {proj.approval_rating}% APPROVAL
                            </span>
                          </div>

                          <div className="sentiment-gauge-bar">
                            <div
                              className="sentiment-gauge-fill"
                              style={{ width: `${proj.approval_rating}%` }}
                            ></div>
                            <div
                              className="sentiment-gauge-marker"
                              style={{ left: `${proj.approval_rating}%` }}
                            ></div>
                          </div>

                          <div className="sentiment-log-section">
                            <div className="sentiment-log-title">
                              <FileText style={{ width: '14px', height: '14px' }} />
                              <span>INSPECTOR'S SATISFACTION AUDIT REPORT</span>
                            </div>
                            <div className="sentiment-log-text">
                              {proj.sentiment_summary}
                            </div>
                          </div>

                          <div className="audit-source-link">
                            <Globe style={{ width: '12px', height: '12px', color: 'var(--color-orange)' }} />
                            <span>Audited Source Thread:</span>
                            <a href={proj.forum_url} target="_blank" rel="noopener noreferrer">
                              {proj.forum_url.slice(0, 40)}...
                              <ExternalLink style={{ width: '10px', height: '10px', display: 'inline', marginLeft: '2px' }} />
                            </a>
                          </div>
                        </div>
                      )}

                    </div>
                  ))
                )}
              </div>
            </div>

          </div>

        </div>

      </main>

      {/* Sticky Terminal Console */}
      <footer className="sticky-console">
        <div className="console-bar" onClick={() => setLogsExpanded(!logsExpanded)}>
          <div className="console-status-indicator">
            <Terminal style={{ width: '16px', height: '16px' }} className="animate-pulse" />
            <span className="console-status-title">TERMINAL STATUS:</span>
            <span className="console-status-text">{txStatus || "STANDBY - READY"}</span>
          </div>

          <div className="console-aside">
            {txHash && (
              <span className="console-tx-hash">
                TX: {txHash.slice(0, 8)}...{txHash.slice(-6)}
              </span>
            )}
            <span className="console-toggle-text">
              {logsExpanded ? "[ HIDE CONSOLE ]" : "[ SHOW CONSOLE ]"}
            </span>
          </div>
        </div>

        {logsExpanded && (
          <div className="console-logs-window">
            {logs.map((log, i) => (
              <div key={i} className={`log-entry ${log.includes("ERROR") ? "error" : ""}`}>
                {log}
              </div>
            ))}
          </div>
        )}
      </footer>

    </div>
  );
}

export default App;
