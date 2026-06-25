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

// Hardcoded contractor preset address for testing convenience
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

  // Create Project Form States
  const [scope, setScope] = useState('');
  const [contractor, setContractor] = useState(PRESET_CONTRACTOR);
  const [funding, setFunding] = useState('10');

  // Audit Form States
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
    if (!scope.trim()) {
      addLog("ERROR: Project scope cannot be empty.");
      return;
    }
    if (!contractor.trim()) {
      addLog("ERROR: Contractor wallet cannot be empty.");
      return;
    }
    if (Number(funding) <= 0) {
      addLog("ERROR: Funding must be positive.");
      return;
    }

    try {
      addLog(`Creating project: "${scope.substring(0, 30)}..." with ${funding} GEN`);
      await createProject(contractor, scope, funding);
      addLog("Project escrow created successfully!");
      setScope('');
    } catch (err) {
      addLog(`ERROR creating project: ${err.message}`);
    }
  };

  const handleAudit = async (projectId, submittedUrl) => {
    if (!submittedUrl.trim()) {
      addLog(`ERROR: Forum URL cannot be empty for project #${projectId}`);
      return;
    }
    try {
      addLog(`Starting citizen satisfaction audit on project #${projectId}...`);
      addLog(`Scraping thread URL: ${submittedUrl}`);
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
    <div className="blueprint-grid min-h-screen flex flex-col font-sans text-[#f5f6f8] pb-12">
      {/* Top Banner / Municipal Header */}
      <div className="caution-stripes"></div>
      <header className="border-b-4 border-[#ff6d00] bg-[#1e2024] px-6 py-4 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <HardHat className="text-[#ffd600] w-10 h-10 stroke-[2.5]" />
          <div>
            <h1 className="text-3xl md:text-4xl text-[#ff6d00] font-bold tracking-wider leading-none">
              CIVICFIX CROWDFUND
            </h1>
            <p className="text-xs text-[#ffd600] font-mono tracking-widest mt-1">
              DECENTRALIZED PUBLIC WORKS & CITIZEN SATISFACTION ESCROW
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 font-mono text-xs">
          {contractAddress ? (
            <div className="bg-[#121315] border border-[#2c2f36] px-3 py-1.5 flex items-center gap-2">
              <span className="text-[#2979ff] font-bold">CONTRACT:</span>
              <span className="text-[#ffd600]">{contractAddress.slice(0, 6)}...{contractAddress.slice(-4)}</span>
            </div>
          ) : (
            <div className="bg-[#ff1744]/10 border border-[#ff1744] text-[#ff1744] px-3 py-1.5">
              NO CONTRACT ADDRESS DETECTED
            </div>
          )}

          <div className="bg-[#121315] border border-[#2c2f36] px-3 py-1.5 flex items-center gap-2">
            <span className="text-[#2979ff] font-bold">ESCROW POOL:</span>
            <span className="text-[#00e676]">{formatGen(contractBalance)} GEN</span>
          </div>

          {address ? (
            <div className="bg-[#2979ff]/10 border border-[#2979ff] text-[#2979ff] px-3 py-1.5 flex items-center gap-1.5">
              <Wallet className="w-3.5 h-3.5" />
              <span>{address.slice(0, 6)}...{address.slice(-4)}</span>
            </div>
          ) : (
            <button
              onClick={handleConnect}
              disabled={loading}
              className="bg-[#ff6d00] text-[#121315] font-bold hover:bg-[#ffd600] px-3 py-1.5 transition-colors"
            >
              CONNECT WALLET
            </button>
          )}
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto w-full px-4 md:px-6 mt-8 flex-grow grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Rules & Preset Center + Create Escrow Form */}
        <div className="lg:col-span-5 flex flex-col gap-8">
          
          {/* Section: Municipal Presets */}
          <div className="construction-border bg-[#1e2024]/95">
            <div className="panel-header">
              <span>MUNICIPAL AUDIT PRESET TEST DATA</span>
              <HelpCircle className="w-4 h-4 text-[#ffd600]" />
            </div>
            <div className="panel-body text-sm space-y-4">
              <p className="text-[#9eabb8] text-xs">
                To test the consensus mechanisms of GenLayer Studio, use these presets to populate the project scope and forum URL. In GenLayer Studio transaction submission, copy-paste the mock description as the web scrape response.
              </p>
              
              <div className="space-y-3">
                {PRESETS.map((preset, idx) => (
                  <div key={idx} className="border border-[#2c2f36] p-3 bg-[#121315] hover:border-[#ff6d00] transition-colors">
                    <div className="flex justify-between items-start">
                      <h4 className="font-bold text-xs text-[#ffd600] font-mono">{preset.name}</h4>
                      <span className={`text-[10px] font-mono px-1.5 py-0.5 ${
                        preset.outcome === "Satisfied" ? "bg-[#00e676]/10 text-[#00e676] border border-[#00e676]" :
                        preset.outcome === "Unsatisfied" ? "bg-[#ff6d00]/10 text-[#ff6d00] border border-[#ff6d00]" :
                        "bg-[#ff1744]/10 text-[#ff1744] border border-[#ff1744]"
                      }`}>
                        {preset.outcome}
                      </span>
                    </div>
                    <p className="text-xs text-[#9eabb8] mt-1.5 font-mono italic">
                      {preset.mockDescription}
                    </p>
                    <button
                      type="button"
                      onClick={() => applyPreset(preset)}
                      className="mt-2.5 text-xs text-[#2979ff] hover:text-[#ffd600] flex items-center gap-1 font-mono"
                    >
                      <Wrench className="w-3 h-3" /> APPLY PRESET DATA
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Section: Create Escrow Project */}
          <div className="double-border bg-[#1e2024]/95">
            <div className="panel-header">
              <span>INITIALIZE PUBLIC WORKS ESCROW POOL</span>
              <DollarSign className="w-4 h-4 text-[#ff6d00]" />
            </div>
            <form onSubmit={handleCreateProject} className="panel-body space-y-4">
              <div>
                <label className="block text-xs font-mono text-[#9eabb8] mb-1">PROJECT SCOPE DESCRIPTION</label>
                <textarea
                  className="input-municipal h-24 resize-none"
                  placeholder="e.g. Repave the massive potholes at the entrance of Block A."
                  value={scope}
                  onChange={(e) => setScope(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono text-[#9eabb8] mb-1">CONTRACTOR ADDRESS</label>
                  <input
                    type="text"
                    className="input-municipal text-xs"
                    placeholder="0x..."
                    value={contractor}
                    onChange={(e) => setContractor(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-[#9eabb8] mb-1">ESCROW FUNDING AMOUNT (GEN)</label>
                  <input
                    type="number"
                    step="any"
                    className="input-municipal text-xs font-mono text-[#00e676]"
                    placeholder="10"
                    value={funding}
                    onChange={(e) => setFunding(e.target.value)}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !address}
                className="btn-municipal w-full justify-center mt-2"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : "DEPLOY PROJECT ESCROW"}
              </button>
              
              {!address && (
                <p className="text-[10px] text-[#ff1744] font-mono text-center">
                  * WALLET MUST BE CONNECTED TO INITIALIZE ESCROW
                </p>
              )}
            </form>
          </div>

        </div>

        {/* Right Column: Active Escrows & AI Auditing */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          
          <div className="construction-border bg-[#1e2024]/95 flex-grow flex flex-col">
            <div className="panel-header">
              <span>ACTIVE PUBLIC WORKS ESCROWS & SENTIMENT AUDITING</span>
              <Globe className="w-4 h-4 text-[#2979ff]" />
            </div>

            <div className="panel-body flex-grow space-y-6 overflow-y-auto max-h-[70vh]">
              {projects.length === 0 ? (
                <div className="h-48 border border-dashed border-[#2c2f36] flex flex-col justify-center items-center text-center">
                  <HardHat className="text-[#2c2f36] w-12 h-12 mb-2" />
                  <p className="text-sm font-mono text-[#9eabb8]">NO PROJECTS LOADED</p>
                  <p className="text-xs text-[#9eabb8]">Create a project on the left or connect to studionet RPC.</p>
                </div>
              ) : (
                projects.map((proj) => (
                  <div
                    key={proj.id}
                    className={`border-2 ${
                      proj.status === "APPROVED" ? "border-[#00e676] bg-[#00e676]/5" : "border-[#ff6d00] bg-[#121315]"
                    } p-5 relative overflow-hidden`}
                  >
                    {/* Stamp Overlay for approved contracts */}
                    {proj.status === "APPROVED" && (
                      <div className="absolute right-4 top-4 z-10">
                        <div className="municipal-stamp">
                          COMMUNITY APPROVED
                        </div>
                      </div>
                    )}

                    <div className="flex justify-between items-start border-b border-[#2c2f36] pb-2.5 mb-4">
                      <div>
                        <span className="text-[10px] font-mono text-[#ffd600] bg-[#ff6d00]/10 border border-[#ff6d00] px-2 py-0.5 mr-2">
                          PROJECT ID #{proj.id}
                        </span>
                        <span className="text-xs font-mono text-[#9eabb8]">
                          Contractor: {proj.contractor.slice(0, 6)}...{proj.contractor.slice(-4)}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="font-mono text-sm text-[#00e676] font-bold">
                          {formatGen(proj.amount)} GEN locked
                        </span>
                      </div>
                    </div>

                    <div className="mb-4">
                      <h3 className="text-sm font-mono text-[#9eabb8] mb-1">SPECIFIED PROJECT SCOPE:</h3>
                      <p className="text-[#f5f6f8] text-sm bg-[#1e2024]/80 p-3 border-l-2 border-[#ff6d00]">
                        {proj.scope}
                      </p>
                    </div>

                    {/* Forum Submission for Active Projects */}
                    {proj.status === "ACTIVE" && (
                      <div className="border border-[#2c2f36] bg-[#1e2024] p-3.5 mb-4 space-y-3">
                        <h4 className="text-xs font-mono text-[#ffd600] flex items-center gap-1.5">
                          <Terminal className="w-3.5 h-3.5 text-[#ff6d00]" /> SUBMIT COMMUNITY DISCUSSION THREAD
                        </h4>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            className="input-municipal text-xs flex-grow"
                            placeholder="https://nextdoor.com/g/pothole-repair-block-a-satisfaction"
                            value={activeAuditProjectId === proj.id ? forumUrl : (activeAuditProjectId === null ? forumUrl : '')}
                            onChange={(e) => {
                              setActiveAuditProjectId(proj.id);
                              setForumUrl(e.target.value);
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => handleAudit(proj.id, forumUrl)}
                            disabled={loading || !address}
                            className="btn-municipal text-xs px-4"
                          >
                            RUN AI AUDIT
                          </button>
                        </div>
                        {(!address) && (
                          <p className="text-[10px] text-[#ff1744] font-mono">
                            * Wallet connection required to trigger auditing
                          </p>
                        )}
                      </div>
                    )}

                    {/* Sentiment Analysis Gauge / Inspector's Log */}
                    {proj.forum_url && (
                      <div className="mt-4 border border-[#2c2f36] bg-[#1e2024]/60 p-4 space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-mono text-[#ffd600]">PUBLIC SENTIMENT RATING</span>
                          <span className="text-xs font-mono font-bold text-[#00e676]">
                            {proj.approval_rating}% APPROVAL
                          </span>
                        </div>
                        
                        <div className="sentiment-meter">
                          <div
                            className="sentiment-fill"
                            style={{ width: `${proj.approval_rating}%` }}
                          ></div>
                          <div
                            className="sentiment-marker"
                            style={{ left: `${proj.approval_rating}%` }}
                          ></div>
                        </div>

                        <div className="pt-2">
                          <h4 className="text-xs font-mono text-[#2979ff] mb-1 flex items-center gap-1">
                            <FileText className="w-3.5 h-3.5" /> INSPECTOR'S SENTIMENT LOG:
                          </h4>
                          <p className="text-xs font-mono text-[#9eabb8] bg-[#121315] p-2.5 border-l border-[#2979ff] leading-relaxed">
                            {proj.sentiment_summary}
                          </p>
                        </div>

                        <div className="text-[10px] font-mono text-[#9eabb8] flex items-center gap-1.5 pt-1">
                          <Globe className="w-3 h-3 text-[#ff6d00]" />
                          <span>Audited Source: </span>
                          <a
                            href={proj.forum_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#2979ff] hover:underline flex items-center gap-0.5"
                          >
                            {proj.forum_url.slice(0, 45)}... <ExternalLink className="w-2.5 h-2.5 inline" />
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

      </main>

      {/* Transaction & Log Drawer */}
      <footer className="fixed bottom-0 left-0 right-0 z-50 bg-[#1e2024] border-t-2 border-[#ff6d00] transition-all duration-300">
        
        {/* Status Bar */}
        <div
          onClick={() => setLogsExpanded(!logsExpanded)}
          className="px-6 py-2.5 flex justify-between items-center cursor-pointer hover:bg-[#2c2f36] select-none text-xs font-mono"
        >
          <div className="flex items-center gap-2">
            <Terminal className="text-[#ff6d00] w-4 h-4 animate-pulse" />
            <span className="text-[#ffd600] font-bold">TERMINAL STATUS:</span>
            <span className="text-[#f5f6f8]">{txStatus || "STANDBY - READY FOR INSTRUCTIONS"}</span>
          </div>
          
          <div className="flex items-center gap-4">
            {txHash && (
              <span className="text-[#2979ff]">
                TX: {txHash.slice(0, 10)}...{txHash.slice(-6)}
              </span>
            )}
            <span className="text-[#9eabb8] hover:text-[#ff6d00]">
              {logsExpanded ? "[ HIDE CONSOLE ]" : "[ SHOW CONSOLE ]"}
            </span>
          </div>
        </div>

        {/* Console Content */}
        {logsExpanded && (
          <div className="bg-[#121315] border-t border-[#2c2f36] px-6 py-4 max-h-48 overflow-y-auto font-mono text-xs text-[#00e676] space-y-1">
            {logs.map((log, i) => (
              <div key={i} className={log.includes("ERROR") ? "text-[#ff1744]" : "text-[#00e676]"}>
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
