import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import CitizenSafeZoneView from '../../components/reports/CitizenSafeZoneView'
import {
  FileText, CheckCircle, Clock, AlertTriangle,
  FilePlus, Map, Bell, User
} from 'lucide-react'

function useCountUp(target, delay = 0) {
  const [val, setVal] = useState(0)
  useEffect(() => {
    const t = setTimeout(() => {
      let v = 0; const step = target / 60
      const id = setInterval(() => {
        v += step
        if (v >= target) { setVal(target); clearInterval(id) }
        else setVal(Math.floor(v))
      }, 16)
      return () => clearInterval(id)
    }, delay)
    return () => clearTimeout(t)
  }, [target, delay])
  return val
}

const REPORTS = [
  { id:'WP-0041', title:'Discoloured water — Main Street',   status:'Under Review', date:'25 Mar' },
  { id:'WP-0038', title:'Odour complaint — Riverside Drive', status:'Resolved',     date:'24 Mar' },
  { id:'WP-0035', title:'Burst pipe — Elm Avenue junction',  status:'Urgent',       date:'23 Mar' },
  { id:'WP-0031', title:'Low pressure — Harbour District',   status:'Under Review', date:'21 Mar' },
]

const METRICS = [
  { label:'pH Level',      value:'7.2', unit:'',     pct:72 },
  { label:'Turbidity',     value:'0.4', unit:'NTU',  pct:88 },
  { label:'Free Chlorine', value:'0.8', unit:'mg/L', pct:65 },
  { label:'Hardness',      value:'142', unit:'ppm',  pct:91 },
]

const NOTICES = [
  '⚡  Scheduled maintenance on Oak Street tonight 22:00–02:00',
  '✅  Elm Avenue pipe repair completed — full service restored',
  '🔬  Zone 4 turbidity slightly elevated — monitoring ongoing',
  '💧  Water Quality Index is 87/100 — Good condition today',
]

const STATUS = {
  'Urgent':       { dot:'#b83232', bg:'rgba(184,50,50,.1)',  tx:'#8c2020' },
  'Under Review': { dot:'#a07010', bg:'rgba(160,112,16,.1)', tx:'#7a5408' },
  'Resolved':     { dot:'#1a7a42', bg:'rgba(26,122,66,.1)',  tx:'#145a32' },
}

export function HomePage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const firstName = user?.name?.split(' ')[0] || 'there'
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  const [notice, setNotice] = useState(0)
  const [show, setShow]     = useState(true)
  const r      = useCountUp(7,   200)
  const res    = useCountUp(5,   350)
  const pend   = useCountUp(2,   500)
  const alerts = useCountUp(3,   650)

  useEffect(() => {
    const id = setInterval(() => {
      setShow(false)
      setTimeout(() => { setNotice(n => (n + 1) % NOTICES.length); setShow(true) }, 350)
    }, 4000)
    return () => clearInterval(id)
  }, [])

  const KPI_CARDS = [
    {
      Icon: FileText,
      lbl: 'Total Reports', val: r, badge: 'This year',
      grad: 'linear-gradient(135deg, #deedf7 0%, #c8dff0 100%)',
      border: '#b2cfe8', iconClr: '#2d6ea0', barClr: '#4a8fc0', barW: 70,
    },
    {
      Icon: CheckCircle,
      lbl: 'Cases Resolved', val: res, badge: '71% rate',
      grad: 'linear-gradient(135deg, #d8f0e2 0%, #bfe4ce 100%)',
      border: '#a4d4b8', iconClr: '#1a6e3a', barClr: '#2e9e5a', barW: 71,
    },
    {
      Icon: Clock,
      lbl: 'Awaiting Review', val: pend, badge: '~3 days',
      grad: 'linear-gradient(135deg, #fdf0d0 0%, #f5e0a8 100%)',
      border: '#e8cc80', iconClr: '#8a6008', barClr: '#c09010', barW: 29,
    },
    {
      Icon: AlertTriangle,
      lbl: 'Active Alerts', val: alerts, badge: 'Zone 4 & 7',
      grad: 'linear-gradient(135deg, #fae0dd 0%, #f0c8c4 100%)',
      border: '#e0a8a4', iconClr: '#8c2820', barClr: '#b83232', barW: 30,
    },
  ]

  const ACTIONS = [
    { Icon: FilePlus, name: 'New Report',  desc: 'Submit a water concern',  fn: () => navigate('/reports') },
    { Icon: Map,      name: 'View Map',    desc: 'Browse nearby incidents', fn: () => navigate('/map') },
    { Icon: Bell,     name: 'Alerts',      desc: 'Manage notifications',    fn: () => {} },
    { Icon: User,     name: 'My Account',  desc: 'Profile & preferences',   fn: () => {} },
  ]

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@400;500;600;700;800&family=Geist+Mono:wght@400;500&display=swap');

        .d {
          --navy:#0a1628; --sky:#2d8bba; --bg:#f0f4f7;
          --text:#0e2233; --sub:#5e7a8a; --border:#d4e0ea;
          font-family:'Bricolage Grotesque',sans-serif;
          background:var(--bg); min-height:100vh; color:var(--text);
          -webkit-font-smoothing:antialiased;
        }

        /* ── hero ───────────────────────── */
        .hero {
          background:linear-gradient(135deg,#0a1628 0%,#0f2a4a 40%,#0d3d6b 70%,#0f4c75 100%);
          padding:44px 0 60px; position:relative; overflow:hidden;
        }
        .hero::after {
          content:''; position:absolute; bottom:-1px; left:0; right:0; height:50px;
          background:var(--bg); clip-path:ellipse(55% 100% at 50% 100%);
        }
        .hero-noise {
          position:absolute; inset:0; pointer-events:none; opacity:.04;
          background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
          background-size:200px;
        }
        .hero-orb { position:absolute; border-radius:50%; pointer-events:none; }
        .orb1 { width:340px;height:340px;background:radial-gradient(circle,rgba(45,139,186,.25) 0%,transparent 70%);top:-80px;right:5%;animation:drift 16s ease-in-out infinite alternate; }
        .orb2 { width:200px;height:200px;background:radial-gradient(circle,rgba(6,182,212,.15) 0%,transparent 70%);bottom:20%;left:8%;animation:drift 20s ease-in-out infinite alternate-reverse; }
        @keyframes drift { from{transform:translate(0,0)} to{transform:translate(24px,18px)} }

        .hero-inner { max-width:1160px; margin:0 auto; padding:0 32px; position:relative; z-index:1; }
        .hero-eyebrow {
          display:inline-flex; align-items:center; gap:7px;
          background:rgba(255,255,255,.08); border:1px solid rgba(255,255,255,.14);
          border-radius:100px; padding:5px 14px; margin-bottom:20px;
          font-size:.68rem; font-weight:600; letter-spacing:.1em; text-transform:uppercase;
          color:rgba(255,255,255,.65); animation:fadeUp .6s ease both;
        }
        .eyebrow-pulse { width:6px;height:6px;border-radius:50%;background:#4ade80;animation:pulse 1.8s ease-in-out infinite; }
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.4;transform:scale(1.5)} }
        .hero-title { font-size:clamp(2rem,3.5vw,3rem);font-weight:800;color:#fff;line-height:1.15;margin-bottom:10px;animation:fadeUp .6s .1s ease both; }
        .hero-title span { color:#67e8f9; }
        .hero-sub { font-size:.95rem;color:rgba(255,255,255,.5);animation:fadeUp .6s .18s ease both; }
        .hero-row { display:flex;align-items:flex-end;justify-content:space-between;flex-wrap:wrap;gap:20px; }
        .hero-btn {
          display:flex;align-items:center;gap:9px;padding:13px 26px;
          background:#fff;color:var(--navy);border:none;border-radius:8px;
          font-family:'Bricolage Grotesque',sans-serif;font-size:.85rem;font-weight:700;
          cursor:pointer;white-space:nowrap;box-shadow:0 4px 20px rgba(0,0,0,.25);
          transition:transform .2s,box-shadow .2s;animation:fadeUp .6s .25s ease both;
        }
        .hero-btn:hover { transform:translateY(-2px);box-shadow:0 8px 32px rgba(0,0,0,.3); }
        .hero-btn-ico { width:18px;height:18px;background:#1251a3;border-radius:4px;display:flex;align-items:center;justify-content:center; }

        /* ── notice ─────────────────────── */
        .notice {
          background:#fefce8;border-top:3px solid #ca8a04;
          padding:11px 32px;display:flex;align-items:center;gap:12px;
          position:relative;z-index:1;animation:fadeUp .5s .3s ease both;
        }
        .notice-label { font-size:.65rem;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:#92400e;white-space:nowrap; }
        .notice-text  { font-size:.82rem;color:#78350f;flex:1;transition:opacity .3s; }
        .notice-ticker { display:flex;gap:5px; }
        .ntick { width:5px;height:5px;border-radius:50%;background:#fcd34d;cursor:pointer;transition:background .2s; }
        .ntick.on { background:#ca8a04; }

        /* ── kpi band ───────────────────── */
        .kpi-band { max-width:1160px;margin:0 auto;padding:28px 32px 0;position:relative;z-index:2; }
        .kpi-grid { display:grid;grid-template-columns:repeat(4,1fr);gap:14px; }
        @media(max-width:840px){.kpi-grid{grid-template-columns:repeat(2,1fr)}}
        @media(max-width:480px){.kpi-grid{grid-template-columns:1fr}}

        .kpi {
          border-radius:16px;padding:22px 20px;
          box-shadow:0 2px 12px rgba(14,34,51,.08);
          animation:scaleIn .5s cubic-bezier(.34,1.4,.64,1) both;
          transition:box-shadow .25s,transform .25s;
        }
        @keyframes scaleIn { from{opacity:0;transform:scale(.88)} to{opacity:1;transform:scale(1)} }
        .kpi:hover { box-shadow:0 10px 32px rgba(14,34,51,.13);transform:translateY(-3px); }
        .kpi-top  { display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:16px; }
        .kpi-icon { width:40px;height:40px;border-radius:11px;display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,.7); }
        .kpi-badge { font-size:.66rem;font-weight:700;padding:3px 10px;border-radius:20px;background:rgba(255,255,255,.65);color:#2a4a60;letter-spacing:.04em; }
        .kpi-val  { font-size:2.4rem;font-weight:800;color:var(--navy);line-height:1;margin-bottom:4px; }
        .kpi-lbl  { font-size:.76rem;color:var(--sub);font-weight:500; }
        .kpi-bar  { height:3px;border-radius:2px;margin-top:14px;overflow:hidden;background:rgba(255,255,255,.55); }
        .kpi-bar-fill { height:100%;border-radius:2px;transition:width 1.4s cubic-bezier(.4,0,.2,1) .6s; }

        /* ── body ───────────────────────── */
        .body { max-width:1160px;margin:28px auto 80px;padding:0 32px; }
        .two-col { display:grid;grid-template-columns:1fr 340px;gap:22px; }
        @media(max-width:900px){.two-col{grid-template-columns:1fr}}
        .col { display:flex;flex-direction:column;gap:22px; }

        /* ── section head ───────────────── */
        .sec-head  { display:flex;align-items:center;justify-content:space-between;margin-bottom:18px; }
        .sec-title { font-size:1.05rem;font-weight:700;color:var(--navy);display:flex;align-items:center;gap:8px; }
        .sec-bar   { width:3px;height:16px;border-radius:2px;background:var(--sky); }
        .sec-link  { font-size:.75rem;color:var(--sky);font-weight:600;cursor:pointer; }
        .sec-link:hover { text-decoration:underline; }

        /* ── card ───────────────────────── */
        .card {
          background:linear-gradient(145deg,#eef3f8 0%,#e4edf5 100%);
          border:1px solid #cddae6;border-radius:16px;overflow:hidden;
          box-shadow:0 2px 10px rgba(14,34,51,.06);animation:fadeUp .65s ease both;
        }

        /* ── tabs ───────────────────────── */
        .tab-row { display:flex;border-bottom:1px solid #c8d8e4;padding:0 20px;background:linear-gradient(135deg,#e8eff6 0%,#dce8f0 100%); }
        .tab { padding:11px 14px;font-size:.76rem;font-weight:600;color:var(--sub);border:none;background:none;cursor:pointer;border-bottom:2px solid transparent;margin-bottom:-1px;transition:all .18s; }
        .tab.on { color:var(--navy);border-bottom-color:var(--sky); }

        /* ── report rows ────────────────── */
        .rep-row { display:flex;align-items:center;gap:14px;padding:14px 20px;border-bottom:1px solid #d8e6f0;cursor:pointer;transition:background .15s; }
        .rep-row:last-child { border-bottom:none; }
        .rep-row:hover { background:rgba(45,139,186,.06); }
        .rep-dot   { width:8px;height:8px;border-radius:50%;flex-shrink:0; }
        .rep-info  { flex:1;min-width:0; }
        .rep-id    { font-family:'Geist Mono',monospace;font-size:.68rem;color:var(--sub);margin-bottom:2px; }
        .rep-title { font-size:.85rem;font-weight:600;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis; }
        .rep-date  { font-size:.72rem;color:var(--sub);white-space:nowrap;margin-right:10px; }
        .rep-pill  { font-size:.65rem;font-weight:700;letter-spacing:.06em;padding:4px 10px;border-radius:20px;white-space:nowrap; }

        /* ── map ────────────────────────── */
        .map-wrap { position:relative;height:180px;overflow:hidden;background:linear-gradient(150deg,#cce9f5 0%,#aad4e8 50%,#90c4de 100%);cursor:pointer; }
        .map-marker { position:absolute;width:14px;height:14px;border-radius:50%;border:2px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.25); }
        .map-marker.urgent { background:#b83232;animation:mPulse 2s ease-in-out infinite; }
        .map-marker.review { background:#a07010; }
        .map-marker.ok     { background:#1a7a42; }
        @keyframes mPulse { 0%{box-shadow:0 0 0 0 rgba(184,50,50,.5)} 70%{box-shadow:0 0 0 12px rgba(184,50,50,0)} 100%{box-shadow:0 0 0 0 rgba(184,50,50,0)} }
        .map-overlay { position:absolute;inset:0;background:linear-gradient(to top,rgba(255,255,255,.12) 0%,transparent 60%);pointer-events:none; }
        .map-btn { position:absolute;bottom:12px;right:12px;background:rgba(255,255,255,.88);backdrop-filter:blur(8px);border:none;border-radius:8px;padding:7px 14px;font-family:'Bricolage Grotesque',sans-serif;font-size:.73rem;font-weight:700;color:var(--navy);cursor:pointer;box-shadow:0 2px 10px rgba(0,0,0,.12); }
        .map-legend { display:flex;gap:16px;padding:10px 18px;border-top:1px solid #c8d8e4;background:linear-gradient(135deg,#e8eff6 0%,#dce8f0 100%); }
        .leg { display:flex;align-items:center;gap:5px;font-size:.68rem;color:var(--sub);font-weight:500; }
        .leg-dot { width:7px;height:7px;border-radius:50%; }

        /* ── quality ────────────────────── */
        .q-top { padding:20px 22px 14px;display:flex;flex-direction:column;align-items:center; }
        .q-score-wrap { position:relative;display:inline-block; }
        .q-center { position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center; }
        .q-num    { font-size:2rem;font-weight:800;color:var(--navy);line-height:1; }
        .q-status { font-size:.62rem;font-weight:700;letter-spacing:.1em;text-transform:uppercase;margin-top:2px; }
        .q-updated { font-size:.68rem;color:var(--sub);margin-top:6px; }
        .q-metrics { padding:0 20px 18px; }
        .q-row { display:flex;align-items:center;gap:10px;padding:9px 0;border-bottom:1px solid #d0dde8; }
        .q-row:last-child { border-bottom:none; }
        .q-name   { font-size:.76rem;color:var(--text);font-weight:500;width:96px;flex-shrink:0; }
        .q-bar-bg { flex:1;height:4px;background:#cddae6;border-radius:2px;overflow:hidden; }
        .q-bar-fg { height:100%;border-radius:2px;transition:width 1.7s cubic-bezier(.4,0,.2,1) .9s; }
        .q-val    { font-family:'Geist Mono',monospace;font-size:.72rem;font-weight:500;color:var(--sub);min-width:56px;text-align:right; }

        /* ── quick actions ──────────────── */
        .act-grid { display:grid;grid-template-columns:1fr 1fr;gap:10px;padding:16px 20px 20px; }
        .act {
          display:flex;flex-direction:column;gap:8px;padding:16px 14px;
          background:linear-gradient(135deg,#e8f0f8 0%,#dce8f2 100%);
          border:1.5px solid #c8d8e8;border-radius:12px;
          cursor:pointer;text-align:left;transition:all .2s;
        }
        .act:hover { background:linear-gradient(135deg,#daeaf6 0%,#cddff0 100%);border-color:#9abcd6;box-shadow:0 6px 20px rgba(45,139,186,.12);transform:translateY(-2px); }
        .act-ico  { color:var(--sky);display:flex; }
        .act-name { font-size:.78rem;font-weight:700;color:var(--navy); }
        .act-desc { font-size:.68rem;color:var(--sub);line-height:1.4; }

        /* ── footer ─────────────────────── */
        .pg-foot { background:var(--navy);color:rgba(255,255,255,.35);font-size:.7rem;text-align:center;padding:14px 32px;letter-spacing:.04em; }

        @keyframes fadeUp { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
      `}</style>

      <div className="d">

        {/* ── Hero ── */}
        <div className="hero">
          <div className="hero-noise" />
          <div className="hero-orb orb1" />
          <div className="hero-orb orb2" />
          <div className="hero-inner">
            <div className="hero-row">
              <div>
                <div className="hero-eyebrow">
                  <span className="eyebrow-pulse" />
                  Citizen Portal — WaterPulse
                </div>
                <h1 className="hero-title">{greeting}, <span>{firstName}</span></h1>
                <p className="hero-sub">Water quality &amp; incident overview for your area</p>
              </div>
              <button className="hero-btn" onClick={() => navigate('/reports')}>
                <div className="hero-btn-ico">
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path d="M5 1v8M1 5h8" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
                  </svg>
                </div>
                Submit a Report
              </button>
            </div>
          </div>
        </div>

        {/* ── Notice ── */}
        <div className="notice">
          <span className="notice-label">Notice</span>
          <span className="notice-text" style={{ opacity: show ? 1 : 0 }}>{NOTICES[notice]}</span>
          <div className="notice-ticker">
            {NOTICES.map((_,i) => (
              <div key={i} className={`ntick ${i===notice?'on':''}`} onClick={()=>setNotice(i)} />
            ))}
          </div>
        </div>

        {/* ── KPI Cards ── */}
        <div className="kpi-band">
          <div className="kpi-grid">
            {KPI_CARDS.map((k, i) => (
              <div
                key={k.lbl}
                className="kpi"
                style={{ animationDelay:`${i*80}ms`, background:k.grad, border:`1px solid ${k.border}` }}
              >
                <div className="kpi-top">
                  <div className="kpi-icon">
                    <k.Icon size={20} color={k.iconClr} strokeWidth={1.8} />
                  </div>
                  <span className="kpi-badge">{k.badge}</span>
                </div>
                <div className="kpi-val">{k.val}</div>
                <div className="kpi-lbl">{k.lbl}</div>
                <div className="kpi-bar">
                  <div className="kpi-bar-fill" style={{ width:`${k.barW}%`, background:k.barClr }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Main body ── */}
        <div className="body">
          <div className="two-col">

            {/* Left column */}
            <div className="col">

              {/* Reports */}
              <div>
                <div className="sec-head">
                  <span className="sec-title"><span className="sec-bar"/>My Reports</span>
                  <span className="sec-link" onClick={()=>navigate('/reports')}>View all →</span>
                </div>
                <div className="card" style={{ animationDelay:'.1s' }}>
                  <div className="tab-row">
                    {['All','Open','Resolved'].map(t => (
                      <button key={t} className="tab on">{t}</button>
                    ))}
                  </div>
                  {REPORTS.map(rep => {
                    const s = STATUS[rep.status]
                    return (
                      <div key={rep.id} className="rep-row">
                        <div className="rep-dot" style={{ background:s.dot }} />
                        <div className="rep-info">
                          <div className="rep-id">{rep.id}</div>
                          <div className="rep-title">{rep.title}</div>
                        </div>
                        <span className="rep-date">{rep.date}</span>
                        <span className="rep-pill" style={{ background:s.bg, color:s.tx }}>{rep.status}</span>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Map */}
              <div>
                <div className="sec-head">
                  <span className="sec-title"><span className="sec-bar"/>Area Incident Map</span>
                  <span className="sec-link" onClick={()=>navigate('/map')}>Open full map →</span>
                </div>
                <div className="card" style={{ animationDelay:'.25s' }}>
                  <div className="map-wrap" onClick={()=>navigate('/map')}>
                    <svg style={{ position:'absolute',inset:0,width:'100%',height:'100%' }}>
                      {[1,2,3,4].map(i=><line key={`h${i}`} x1="0" y1={`${i*20}%`} x2="100%" y2={`${i*20}%`} stroke="rgba(10,22,40,.08)" strokeWidth=".8"/>)}
                      {[1,2,3,4,5,6].map(i=><line key={`v${i}`} x1={`${i*14.2}%`} y1="0" x2={`${i*14.2}%`} y2="100%" stroke="rgba(10,22,40,.08)" strokeWidth=".8"/>)}
                    </svg>
                    <div className="map-overlay" />
                    <div className="map-marker urgent" style={{ top:'42%',left:'44%' }} />
                    <div className="map-marker review" style={{ top:'26%',left:'25%' }} />
                    <div className="map-marker review" style={{ top:'60%',left:'62%' }} />
                    <div className="map-marker ok"     style={{ top:'18%',left:'68%' }} />
                    <button className="map-btn">Open full map →</button>
                  </div>
                  <div className="map-legend">
                    {[['#b83232','Urgent'],['#a07010','Under Review'],['#1a7a42','Resolved']].map(([c,l])=>(
                      <div key={l} className="leg"><div className="leg-dot" style={{background:c}}/>{l}</div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Safe Zones */}
              <div>
                <div className="sec-head">
                  <span className="sec-title"><span className="sec-bar"/>Safe Zones</span>
                </div>
                <div className="card" style={{ animationDelay:'.4s', padding: 0, overflow: 'hidden' }}>
                  <CitizenSafeZoneView />
                </div>
              </div>
            </div>

            {/* Right column */}
            <div className="col">

              {/* Quality */}
              <div>
                <div className="sec-head">
                  <span className="sec-title"><span className="sec-bar"/>Water Quality Index</span>
                  <span style={{ fontSize:'.68rem',color:'#1a7a42',fontWeight:600,background:'rgba(26,122,66,.1)',padding:'3px 9px',borderRadius:'20px' }}>● Live</span>
                </div>
                <div className="card" style={{ animationDelay:'.15s' }}>
                  <div className="q-top">
                    <QualityArc score={87} />
                    <span className="q-updated">Updated 25 Mar 2025, 09:14</span>
                  </div>
                  <div className="q-metrics">
                    {METRICS.map(m => (
                      <div className="q-row" key={m.label}>
                        <span className="q-name">{m.label}</span>
                        <div className="q-bar-bg">
                          <div className="q-bar-fg" style={{ width:`${m.pct}%`, background:m.pct>=80?'#2e9e5a':'#4a8fc0' }} />
                        </div>
                        <span className="q-val">{m.value}{m.unit}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div>
                <div className="sec-head">
                  <span className="sec-title"><span className="sec-bar"/>Quick Actions</span>
                </div>
                <div className="card" style={{ animationDelay:'.3s' }}>
                  <div className="act-grid">
                    {ACTIONS.map(a => (
                      <button key={a.name} className="act" onClick={a.fn}>
                        <span className="act-ico"><a.Icon size={20} strokeWidth={1.8} /></span>
                        <span className="act-name">{a.name}</span>
                        <span className="act-desc">{a.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>

        <div className="pg-foot">
          WaterPulse Citizen Portal &nbsp;·&nbsp; © {new Date().getFullYear()} Community Water Management Authority
        </div>
      </div>
    </>
  )
}

/* ── Arc widget ──────────────────────────────────── */
function QualityArc({ score }) {
  const R = 54, circ = 2 * Math.PI * R
  const [offset, setOffset] = useState(circ)
  useEffect(() => {
    const t = setTimeout(() => setOffset(circ - (score / 100) * circ), 500)
    return () => clearTimeout(t)
  }, [])
  const color = score >= 80 ? '#2e9e5a' : score >= 60 ? '#c09010' : '#b83232'
  const label = score >= 80 ? 'Excellent' : score >= 60 ? 'Fair' : 'Poor'
  return (
    <div className="q-score-wrap">
      <svg width="128" height="128" viewBox="0 0 128 128">
        <circle cx="64" cy="64" r={R} fill="none" stroke="#cddae6" strokeWidth="9"/>
        <circle cx="64" cy="64" r={R} fill="none" stroke={color} strokeWidth="9"
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
          transform="rotate(-90 64 64)"
          style={{ transition:'stroke-dashoffset 1.6s cubic-bezier(.4,0,.2,1)' }}/>
      </svg>
      <div className="q-center">
        <span className="q-num">{score}</span>
        <span className="q-status" style={{ color }}>{label}</span>
      </div>
    </div>
  )
}