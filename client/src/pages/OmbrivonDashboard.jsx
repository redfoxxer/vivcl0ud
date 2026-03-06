import { useState, useEffect } from "react";

const MOCK_DATA = {
  totalAllowed: 1523,
  totalBlocked: 47,
  activeRateLimits: ["45.33.32.156", "192.241.235.82"],
  blacklistedIPs: ["103.21.244.0", "198.51.100.42"],
  whitelistedIPs: ["127.0.0.1", "::1"],
  recentThreats: [
    { ip: "45.33.32.156", reason: "SQL injection attempt detected", time: "14:23:01", type: "sqli" },
    { ip: "192.241.235.82", reason: "Rate limit exceeded (87 req in 60s)", time: "14:22:45", type: "ratelimit" },
    { ip: "103.21.244.0", reason: "XSS attempt detected", time: "14:21:33", type: "xss" },
    { ip: "198.51.100.42", reason: "Path traversal attempt detected", time: "14:19:12", type: "traversal" },
    { ip: "67.205.172.233", reason: "Honeypot triggered (bot detected)", time: "14:18:55", type: "honeypot" },
    { ip: "45.33.32.156", reason: "Command injection attempt detected", time: "14:17:02", type: "cmdinject" },
  ],
};

const THREAT_COLORS = { sqli: "#ff4444", ratelimit: "#ffaa00", xss: "#ff6699", traversal: "#aa44ff", honeypot: "#44ffaa", cmdinject: "#ff8844" };
const THREAT_LABELS = { sqli: "SQLi", ratelimit: "RATE", xss: "XSS", traversal: "PATH", honeypot: "BOT", cmdinject: "CMD" };

function GlitchText({ text }) {
  const [glitch, setGlitch] = useState(false);
  useEffect(() => {
    const interval = setInterval(() => { setGlitch(true); setTimeout(() => setGlitch(false), 150); }, 4000);
    return () => clearInterval(interval);
  }, []);
  return (
    <span style={{ position: "relative", display: "inline-block" }}>
      <span style={{ opacity: glitch ? 0.7 : 1, filter: glitch ? "blur(1px)" : "none", transition: "all 0.05s" }}>{text}</span>
      {glitch && <span style={{ position: "absolute", left: 2, top: 0, color: "#ff4444", opacity: 0.6, clipPath: "polygon(0 30%, 100% 30%, 100% 50%, 0 50%)" }}>{text}</span>}
    </span>
  );
}

function PulsingDot({ color = "#00ff88" }) {
  return (
    <span style={{ position: "relative", display: "inline-block", width: 10, height: 10 }}>
      <span style={{ position: "absolute", inset: 0, borderRadius: "50%", background: color, animation: "ping 1.5s ease-in-out infinite", opacity: 0.4 }} />
      <span style={{ position: "absolute", inset: 2, borderRadius: "50%", background: color }} />
    </span>
  );
}

function StatCard({ label, value, sub, color = "#00ff88", icon }) {
  const [animated, setAnimated] = useState(0);
  useEffect(() => {
    let start = 0;
    const end = parseInt(value);
    if (isNaN(end)) return;
    const step = end / (1200 / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= end) { setAnimated(end); clearInterval(timer); } else setAnimated(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [value]);
  return (
    <div style={{ background: "rgba(0,0,0,0.6)", border: `1px solid ${color}22`, borderRadius: 2, padding: "20px 24px", position: "relative", overflow: "hidden", flex: 1, minWidth: 160 }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent, ${color}, transparent)`, animation: "scanline 3s linear infinite" }} />
      <div style={{ color: `${color}88`, fontSize: 11, letterSpacing: 3, textTransform: "uppercase", marginBottom: 8, fontFamily: "monospace" }}>{icon} {label}</div>
      <div style={{ color, fontSize: 42, fontWeight: 900, fontFamily: "monospace", lineHeight: 1, letterSpacing: -2 }}>{isNaN(parseInt(value)) ? value : animated}</div>
      {sub && <div style={{ color: `${color}66`, fontSize: 11, marginTop: 6, fontFamily: "monospace" }}>{sub}</div>}
    </div>
  );
}

function BlockRateRing({ blocked, total }) {
  const pct = total > 0 ? (blocked / total) * 100 : 0;
  const r = 54, circ = 2 * Math.PI * r, dash = (pct / 100) * circ;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
      <svg width={130} height={130} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={65} cy={65} r={r} fill="none" stroke="#ffffff0a" strokeWidth={8} />
        <circle cx={65} cy={65} r={r} fill="none" stroke="#ff4444" strokeWidth={8} strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" style={{ transition: "stroke-dasharray 1.5s ease", filter: "drop-shadow(0 0 6px #ff4444)" }} />
      </svg>
      <div style={{ marginTop: -80, textAlign: "center", fontFamily: "monospace" }}>
        <div style={{ color: "#ff4444", fontSize: 28, fontWeight: 900 }}>{pct.toFixed(1)}%</div>
        <div style={{ color: "#ffffff44", fontSize: 10, letterSpacing: 2 }}>BLOCK RATE</div>
      </div>
      <div style={{ marginTop: 16 }} />
    </div>
  );
}

export default function OmbrivonDashboard() {
  const [data, setData] = useState(MOCK_DATA);
  const [newIP, setNewIP] = useState("");
  const [tab, setTab] = useState("threats");
  const [time, setTime] = useState(new Date().toLocaleTimeString());
  const [addMode, setAddMode] = useState("blacklist");

  useEffect(() => {
    const t = setInterval(() => setTime(new Date().toLocaleTimeString()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const threats = [
      { ip: "77.88.55.60", reason: "SQL injection attempt detected", type: "sqli" },
      { ip: "192.168.99.1", reason: "Rate limit exceeded", type: "ratelimit" },
      { ip: "5.196.1.1", reason: "XSS attempt detected", type: "xss" },
    ];
    let i = 0;
    const interval = setInterval(() => {
      const threat = { ...threats[i % threats.length], time: new Date().toLocaleTimeString() };
      setData(d => ({ ...d, totalBlocked: d.totalBlocked + 1, recentThreats: [threat, ...d.recentThreats.slice(0, 19)] }));
      i++;
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleAddIP = () => {
    if (!newIP.trim()) return;
    if (addMode === "blacklist") setData(d => ({ ...d, blacklistedIPs: [newIP, ...d.blacklistedIPs] }));
    else setData(d => ({ ...d, whitelistedIPs: [newIP, ...d.whitelistedIPs] }));
    setNewIP("");
  };

  const removeBlacklisted = (ip) => setData(d => ({ ...d, blacklistedIPs: d.blacklistedIPs.filter(i => i !== ip) }));
  const removeWhitelisted = (ip) => setData(d => ({ ...d, whitelistedIPs: d.whitelistedIPs.filter(i => i !== ip) }));

  return (
    <div style={{ minHeight: "100vh", background: "#050508", backgroundImage: "radial-gradient(ellipse at 20% 20%, #0a0a1a 0%, transparent 60%)", color: "#fff", fontFamily: "monospace" }}>
      <style>{`
        @keyframes ping { 0%,100%{transform:scale(1);opacity:0.4}50%{transform:scale(2.5);opacity:0} }
        @keyframes scanline { 0%{transform:translateX(-100%)}100%{transform:translateX(100%)} }
        @keyframes fadeInLeft { from{opacity:0;transform:translateX(-10px)}to{opacity:1;transform:translateX(0)} }
        @keyframes blink { 0%,100%{opacity:1}50%{opacity:0} }
        ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-track{background:#0a0a0a}::-webkit-scrollbar-thumb{background:#ffffff22}
        input::placeholder{color:#ffffff22}
      `}</style>

      {/* Header */}
      <div style={{ borderBottom: "1px solid #ffffff0a", padding: "16px 32px", display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(0,0,0,0.8)", backdropFilter: "blur(20px)", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <img src="/ombrivon-logo.png" alt="OMBRIVON" style={{ height: 48, filter: "drop-shadow(0 0 8px #ff4444)" }} />
          <div>
            <div style={{ fontSize: 18, fontWeight: 900, letterSpacing: 4, color: "#fff" }}><GlitchText text="OMBRIVON" /></div>
            <div style={{ fontSize: 10, color: "#ffffff33", letterSpacing: 3 }}>FIREWALL COMMAND CENTER · by vivi.</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}><PulsingDot color="#00ff88" /><span style={{ color: "#00ff8888", fontSize: 11, letterSpacing: 2 }}>ACTIVE</span></div>
          <div style={{ color: "#ffffff44", fontSize: 12 }}>{time}</div>
        </div>
      </div>

      <div style={{ padding: "28px 32px" }}>
        {/* Stat Cards */}
        <div style={{ display: "flex", gap: 16, marginBottom: 28, flexWrap: "wrap" }}>
          <StatCard label="Allowed" value={data.totalAllowed} color="#00ff88" icon="✓" sub="total requests passed" />
          <StatCard label="Blocked" value={data.totalBlocked} color="#ff4444" icon="✕" sub="threats neutralized" />
          <StatCard label="Blacklisted" value={data.blacklistedIPs.length} color="#ff8844" icon="◉" sub="banned IPs" />
          <StatCard label="Rate Limited" value={data.activeRateLimits.length} color="#ffaa00" icon="⚡" sub="currently throttled" />
          <div style={{ background: "rgba(0,0,0,0.6)", border: "1px solid #ff444422", borderRadius: 2, padding: "20px 24px", flex: 1, minWidth: 160, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <BlockRateRing blocked={data.totalBlocked} total={data.totalAllowed + data.totalBlocked} />
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 2, marginBottom: 20, borderBottom: "1px solid #ffffff0a" }}>
          {["threats", "ips", "stats"].map(t => (
            <button key={t} onClick={() => setTab(t)} style={{ background: tab === t ? "#ffffff0a" : "none", border: "none", borderBottom: tab === t ? "2px solid #ff4444" : "2px solid transparent", color: tab === t ? "#fff" : "#ffffff44", padding: "10px 24px", cursor: "pointer", fontSize: 11, letterSpacing: 3, textTransform: "uppercase", fontFamily: "monospace" }}>
              {t === "threats" ? "⚠ THREAT LOG" : t === "ips" ? "◉ IP CONTROL" : "◈ SYSTEM"}
            </button>
          ))}
        </div>

        {/* Threat Feed */}
        {tab === "threats" && (
          <div style={{ background: "rgba(0,0,0,0.5)", border: "1px solid #ffffff0a", borderRadius: 2, padding: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ fontSize: 11, letterSpacing: 3, color: "#ffffff44" }}>LIVE THREAT FEED</div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}><PulsingDot color="#ff4444" /><span style={{ color: "#ff444488", fontSize: 10, letterSpacing: 2 }}>MONITORING</span></div>
            </div>
            {data.recentThreats.map((t, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.04)", animation: "fadeInLeft 0.3s ease forwards" }}>
                <span style={{ background: `${THREAT_COLORS[t.type]}22`, color: THREAT_COLORS[t.type], border: `1px solid ${THREAT_COLORS[t.type]}44`, borderRadius: 2, padding: "2px 8px", fontSize: 10, letterSpacing: 2, minWidth: 48, textAlign: "center" }}>{THREAT_LABELS[t.type]}</span>
                <span style={{ color: "#ffffff88", fontSize: 12 }}>{t.time}</span>
                <span style={{ color: "#00ccff", fontSize: 12, minWidth: 130 }}>{t.ip}</span>
                <span style={{ color: "#ffffff55", fontSize: 12, flex: 1 }}>{t.reason}</span>
              </div>
            ))}
          </div>
        )}

        {/* IP Control */}
        {tab === "ips" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            <div style={{ background: "rgba(0,0,0,0.5)", border: "1px solid #ffffff0a", borderRadius: 2, padding: 24 }}>
              <div style={{ color: "#ff444488", fontSize: 10, letterSpacing: 3, marginBottom: 10 }}>BLACKLISTED IPs [{data.blacklistedIPs.length}]</div>
              {data.blacklistedIPs.length === 0 && <div style={{ color: "#ffffff22", fontSize: 12 }}>— NONE —</div>}
              {data.blacklistedIPs.map((ip, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", background: "#ff44440a", border: "1px solid #ff444422", borderRadius: 2, marginBottom: 6 }}>
                  <span style={{ color: "#ff4444", fontSize: 13 }}>{ip}</span>
                  <button onClick={() => removeBlacklisted(ip)} style={{ background: "none", border: "none", color: "#ff444466", cursor: "pointer", fontSize: 16 }}>×</button>
                </div>
              ))}
            </div>
            <div style={{ background: "rgba(0,0,0,0.5)", border: "1px solid #ffffff0a", borderRadius: 2, padding: 24 }}>
              <div style={{ color: "#00ff8888", fontSize: 10, letterSpacing: 3, marginBottom: 10 }}>WHITELISTED IPs [{data.whitelistedIPs.length}]</div>
              {data.whitelistedIPs.length === 0 && <div style={{ color: "#ffffff22", fontSize: 12 }}>— NONE —</div>}
              {data.whitelistedIPs.map((ip, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", background: "#00ff880a", border: "1px solid #00ff8822", borderRadius: 2, marginBottom: 6 }}>
                  <span style={{ color: "#00ff88", fontSize: 13 }}>{ip}</span>
                  <button onClick={() => removeWhitelisted(ip)} style={{ background: "none", border: "none", color: "#00ff8866", cursor: "pointer", fontSize: 16 }}>×</button>
                </div>
              ))}
            </div>
            <div style={{ gridColumn: "1/-1", background: "rgba(0,0,0,0.5)", border: "1px solid #ffffff0a", borderRadius: 2, padding: 24 }}>
              <div style={{ fontSize: 11, letterSpacing: 3, color: "#ffffff44", marginBottom: 16 }}>ADD IP ADDRESS</div>
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <input value={newIP} onChange={e => setNewIP(e.target.value)} onKeyDown={e => e.key === "Enter" && handleAddIP()} placeholder="Enter IP address e.g. 192.168.1.1" style={{ flex: 1, background: "#ffffff08", border: "1px solid #ffffff15", color: "#fff", padding: "10px 16px", borderRadius: 2, fontSize: 13, fontFamily: "monospace", outline: "none" }} />
                {["blacklist", "whitelist"].map(mode => (
                  <button key={mode} onClick={() => setAddMode(mode)} style={{ padding: "10px 16px", border: `1px solid ${addMode === mode ? (mode === "blacklist" ? "#ff4444" : "#00ff88") : "#ffffff15"}`, background: addMode === mode ? (mode === "blacklist" ? "#ff444422" : "#00ff8822") : "none", color: addMode === mode ? (mode === "blacklist" ? "#ff4444" : "#00ff88") : "#ffffff44", cursor: "pointer", fontSize: 11, letterSpacing: 2, fontFamily: "monospace", borderRadius: 2 }}>{mode.toUpperCase()}</button>
                ))}
                <button onClick={handleAddIP} style={{ padding: "10px 24px", background: "#ff444422", border: "1px solid #ff444466", color: "#ff4444", cursor: "pointer", fontSize: 11, letterSpacing: 2, fontFamily: "monospace", borderRadius: 2, fontWeight: 700 }}>ADD →</button>
              </div>
            </div>
          </div>
        )}

        {/* System Stats */}
        {tab === "stats" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {[
              { label: "RATE LIMIT WINDOW", value: "60 seconds", color: "#ffaa00" },
              { label: "MAX REQUESTS / MIN", value: "60 req", color: "#ffaa00" },
              { label: "BLOCK DURATION", value: "5 minutes", color: "#ff4444" },
              { label: "MAX BODY SIZE", value: "10 MB", color: "#00ccff" },
              { label: "SQL INJECTION", value: "🛡 ACTIVE", color: "#00ff88" },
              { label: "XSS PROTECTION", value: "🛡 ACTIVE", color: "#00ff88" },
              { label: "PATH TRAVERSAL", value: "🛡 ACTIVE", color: "#00ff88" },
              { label: "CMD INJECTION", value: "🛡 ACTIVE", color: "#00ff88" },
              { label: "HONEYPOT TRAP", value: "🍯 ACTIVE", color: "#00ff88" },
              { label: "SECURITY HEADERS", value: "✓ ENABLED", color: "#00ff88" },
            ].map((item, i) => (
              <div key={i} style={{ background: "rgba(0,0,0,0.5)", border: `1px solid ${item.color}15`, borderRadius: 2, padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ color: "#ffffff44", fontSize: 11, letterSpacing: 2 }}>{item.label}</span>
                <span style={{ color: item.color, fontSize: 13, fontWeight: 700 }}>{item.value}</span>
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <div style={{ marginTop: 32, borderTop: "1px solid #ffffff08", paddingTop: 16, display: "flex", justifyContent: "space-between" }}>
          <span style={{ color: "#ffffff22", fontSize: 10, letterSpacing: 3 }}>OMBRIVON v1.0.0 · by vivi.</span>
          <span style={{ color: "#ffffff22", fontSize: 10, letterSpacing: 2 }}>
            <span style={{ animation: "blink 1s infinite", display: "inline-block" }}>█</span>{" "}ALL SYSTEMS NOMINAL
          </span>
        </div>
      </div>
    </div>
  );
}
