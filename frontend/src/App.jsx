import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";

const API = "http://localhost:8080/api";

function statusLabel(status) {
  return ({
    WAITING: "Waiting",
    SERVING: "Serving",
    COMPLETED: "Completed",
    SKIPPED: "Skipped"
  })[status] || status;
}

export default function App() {
  const [view, setView] = useState("patient");
  const [patientName, setPatientName] = useState("");
  const [department, setDepartment] = useState("General Medicine");
  const [tokens, setTokens] = useState([]);
  const [myToken, setMyToken] = useState(null);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const loadTokens = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/tokens`);
      setTokens(response.data);
      setError("");
    } catch {
      setError("Cannot connect to the backend. Start the Spring Boot server and check MySQL settings.");
    }
  }, []);

  useEffect(() => {
    loadTokens();
    const timer = setInterval(loadTokens, 10000);
    return () => clearInterval(timer);
  }, [loadTokens]);

  const waitingCount = tokens.filter(t => t.status === "WAITING").length;
  const servingToken = tokens.find(t => t.status === "SERVING");
  const averageMinutes = 10;

  const estimatedWait = useMemo(() => {
    if (!myToken) return null;
    const ahead = tokens.filter(t =>
      t.department === myToken.department &&
      t.status === "WAITING" &&
      t.id < myToken.id
    ).length;
    return ahead * averageMinutes + (servingToken ? averageMinutes : 0);
  }, [tokens, myToken, servingToken]);

  async function createToken(event) {
    event.preventDefault();
    if (!patientName.trim()) {
      setNotice("Please enter the patient's name.");
      return;
    }
    setLoading(true);
    setNotice("");
    try {
      const response = await axios.post(`${API}/tokens`, {
        patientName: patientName.trim(),
        department
      });
      setMyToken(response.data);
      setPatientName("");
      setNotice(`Your token ${response.data.tokenNumber} has been created.`);
      await loadTokens();
    } catch (e) {
      setNotice(e.response?.data?.message || "Could not create token. Check the backend.");
    } finally {
      setLoading(false);
    }
  }

  async function callNext() {
    setNotice("");
    try {
      const response = await axios.post(`${API}/tokens/call-next`);
      setNotice(response.data.message || "Next patient called.");
      await loadTokens();
    } catch (e) {
      setNotice(e.response?.data?.message || "Could not call the next patient.");
    }
  }

  async function updateStatus(id, status) {
    try {
      await axios.patch(`${API}/tokens/${id}/status`, { status });
      setNotice(`Token status updated to ${statusLabel(status)}.`);
      await loadTokens();
    } catch (e) {
      setNotice(e.response?.data?.message || "Could not update token status.");
    }
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="#" onClick={() => setView("patient")}>
          <span className="brand-icon">＋</span>
          <span>Smart<span className="brand-accent">Queue</span><small>LESS WAITING. BETTER CARE.</small></span>
        </a>
        <nav>
          <button className={view === "patient" ? "nav-btn active" : "nav-btn"} onClick={() => setView("patient")}>Patient</button>
          <button className={view === "staff" ? "nav-btn active" : "nav-btn"} onClick={() => setView("staff")}>Receptionist</button>
        </nav>
      </header>

      <main>
        <section className="hero">
          <div>
            <p className="eyebrow">DIGITAL HOSPITAL QUEUE</p>
            <h1>Your time matters.<br /><span>Waiting made simpler.</span></h1>
            <p className="hero-copy">Get a digital token, follow your queue status, and spend less time wondering when your turn will come.</p>
            <div className="hero-pills"><span>✓ Digital tokens</span><span>✓ Live queue refresh</span><span>✓ Clear status</span></div>
          </div>
          <div className="hero-card">
            <div className="pulse-icon">✚</div>
            <p className="muted">CURRENTLY SERVING</p>
            <div className="big-token">{servingToken?.tokenNumber || "—"}</div>
            <span className="status-badge serving">{servingToken ? "Doctor is attending" : "No patient being served"}</span>
            <div className="hero-stats">
              <div><strong>{waitingCount}</strong><small>Waiting</small></div>
              <div><strong>{tokens.length}</strong><small>Today's tokens</small></div>
            </div>
          </div>
        </section>

        {error && <div className="alert error">{error}</div>}
        {notice && <div className="alert">{notice}<button className="dismiss" onClick={() => setNotice("")}>×</button></div>}

        {view === "patient" ? (
          <section className="content-grid">
            <div className="panel">
              <div className="section-heading"><div><p className="eyebrow">PATIENT PORTAL</p><h2>Get your token</h2></div><span className="step-number">01</span></div>
              <p className="muted">Enter your name and select a department to join today's queue.</p>
              <form onSubmit={createToken} className="token-form">
                <label>Patient name<input value={patientName} onChange={e => setPatientName(e.target.value)} placeholder="e.g. Asha Patil" maxLength="100" /></label>
                <label>Department
                  <select value={department} onChange={e => setDepartment(e.target.value)}>
                    <option>General Medicine</option><option>Dental</option><option>Paediatrics</option><option>Orthopaedics</option><option>Dermatology</option>
                  </select>
                </label>
                <button className="primary-btn" disabled={loading}>{loading ? "Generating..." : "Generate digital token"} <span>→</span></button>
              </form>
              {myToken && <div className="my-token">
                <div><span className="muted">YOUR TOKEN</span><h3>{myToken.tokenNumber}</h3><p>{myToken.department}</p></div>
                <div className="token-side"><span className={`status-badge ${myToken.status.toLowerCase()}`}>{statusLabel(myToken.status)}</span><p>Estimated wait</p><strong>{estimatedWait ?? 0} min</strong></div>
              </div>}
              <div className="tip-box"><span>ⓘ</span><p>Waiting time is an estimate based on queue position and an assumed 10-minute consultation. Emergencies may affect the order.</p></div>
            </div>

            <div className="panel queue-panel">
              <div className="section-heading"><div><p className="eyebrow">QUEUE OVERVIEW</p><h2>Today's queue</h2></div><button className="refresh-btn" onClick={loadTokens}>↻ Refresh</button></div>
              <div className="queue-summary"><div><span className="dot green"></span><span>Now serving</span><strong>{servingToken?.tokenNumber || "—"}</strong></div><div><span className="dot orange"></span><span>Waiting</span><strong>{waitingCount}</strong></div></div>
              <div className="table-wrap"><table><thead><tr><th>Token</th><th>Department</th><th>Status</th></tr></thead><tbody>
                {tokens.length ? tokens.map(t => <tr key={t.id}><td className="token-cell">{t.tokenNumber}</td><td>{t.department}</td><td><span className={`status-badge ${t.status.toLowerCase()}`}>{statusLabel(t.status)}</span></td></tr>) : <tr><td colSpan="3" className="empty">No tokens yet. Be the first to join.</td></tr>}
              </tbody></table></div>
              <p className="auto-refresh">Queue refreshes automatically every 10 seconds.</p>
            </div>
          </section>
        ) : (
          <section className="panel staff-panel">
            <div className="section-heading"><div><p className="eyebrow">STAFF WORKSPACE</p><h2>Receptionist dashboard</h2><p className="muted">Manage the queue and update patient token statuses.</p></div><span className="staff-tag">DEMO MODE</span></div>
            <div className="staff-actions"><div><span className="muted">Patients waiting</span><strong>{waitingCount}</strong></div><div><span className="muted">Currently serving</span><strong>{servingToken?.tokenNumber || "—"}</strong></div><button className="primary-btn" onClick={callNext}>Call next patient →</button></div>
            <div className="table-wrap"><table><thead><tr><th>Token</th><th>Patient</th><th>Department</th><th>Status</th><th>Actions</th></tr></thead><tbody>
              {tokens.length ? tokens.map(t => <tr key={t.id}><td className="token-cell">{t.tokenNumber}</td><td>{t.patientName}</td><td>{t.department}</td><td><span className={`status-badge ${t.status.toLowerCase()}`}>{statusLabel(t.status)}</span></td><td className="actions">
                {t.status === "SERVING" && <button className="small-btn complete" onClick={() => updateStatus(t.id, "COMPLETED")}>Complete</button>}
                {t.status === "WAITING" && <button className="small-btn skip" onClick={() => updateStatus(t.id, "SKIPPED")}>Skip</button>}
                {t.status === "SKIPPED" && <button className="small-btn" onClick={() => updateStatus(t.id, "WAITING")}>Rejoin</button>}
                {t.status === "COMPLETED" && <span className="muted">Done</span>}
              </td></tr>) : <tr><td colSpan="5" className="empty">No tokens available yet.</td></tr>}
            </tbody></table></div>
            <p className="security-note">Demo only: this receptionist screen has no login protection. Add authentication before real deployment.</p>
          </section>
        )}

        <section className="bottom-note"><span>✚</span><div><strong>Designed for calmer clinic visits</strong><p>SmartQueue helps patients and staff stay informed. It does not replace emergency triage or clinical judgement.</p></div></section>
      </main>
      <footer>© 2026 SmartQueue · Student project prototype</footer>
    </div>
  );
}
