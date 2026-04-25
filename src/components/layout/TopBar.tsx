import { useEffect, useState } from 'react';
import type { SectionId } from '../../store/useStore';

const NAV_META: Record<SectionId, { label: string; icon: string; color: string }> = {
  dashboard:     { label:'Dashboard',     icon:'⊞', color:'#00e5ff' },
  salud:         { label:'Salud & Ayuno', icon:'⚖️', color:'#00e896' },
  productividad: { label:'Productividad', icon:'📊', color:'#ffe040' },
  habitos:       { label:'Hábitos',       icon:'🔥', color:'#a855f7' },
  finanzas:      { label:'Finanzas',      icon:'💰', color:'#ffe040' },
};

interface Props {
  section: SectionId;
  mobile: boolean;
  onToggleCollapse: () => void;
  studyTimerStart?: string | null;
  workTimerStart?: string | null;
  studyTimerSubject?: string;
  workTimerSubject?: string;
  onGoToProductividad?: () => void;
}

function fmtSecs(secs: number) {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  if (h > 0) return `${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  return `${m}:${String(s).padStart(2,'0')}`;
}

export function TopBar({ section, mobile, onToggleCollapse, studyTimerStart, workTimerStart, studyTimerSubject, workTimerSubject, onGoToProductividad }: Props) {
  const nav = NAV_META[section];
  const [tick, setTick] = useState(0);

  const anyTimer = studyTimerStart || workTimerStart;
  useEffect(() => {
    if (!anyTimer) return;
    const id = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(id);
  }, [anyTimer]);

  const studySecs = studyTimerStart ? Math.floor((Date.now() - new Date(studyTimerStart).getTime()) / 1000) : 0;
  const workSecs  = workTimerStart  ? Math.floor((Date.now() - new Date(workTimerStart).getTime())  / 1000) : 0;
  void tick; // triggers re-render

  return (
    <div style={{
      height:52, flexShrink:0,
      background:'rgba(6,16,31,0.95)',
      borderBottom:'1px solid rgba(0,170,255,0.07)',
      display:'flex', alignItems:'center',
      padding:'0 20px', gap:12,
      backdropFilter:'blur(12px)',
    }}>
      {!mobile ? (
        <button
          onClick={onToggleCollapse}
          style={{ background:'transparent', border:'none', cursor:'pointer', color:'rgba(255,255,255,0.4)', fontSize:16, padding:'4px', borderRadius:6, display:'flex', alignItems:'center', justifyContent:'center', transition:'color .15s' }}
          onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.8)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.4)')}
        >☰</button>
      ) : (
        <div style={{ width:28, height:28, borderRadius:14, background:'linear-gradient(135deg,#00aaff,#0040a0)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:900, color:'white', boxShadow:'0 0 10px rgba(0,170,255,0.35)', flexShrink:0 }}>SS</div>
      )}

      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
        <span style={{ fontSize:16 }}>{nav.icon}</span>
        <span style={{ fontSize:14, fontWeight:700, color:'rgba(255,255,255,0.85)', letterSpacing:-.2 }}>{nav.label}</span>
      </div>

      <div style={{ flex:1 }}/>

      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
        {/* Live timer pill when a timer is running */}
        {studyTimerStart && (
          <button onClick={onGoToProductividad} style={{ display:'flex', alignItems:'center', gap:6, padding:'4px 10px', borderRadius:20, border:'1px solid #ffe04050', background:'#ffe04012', cursor: onGoToProductividad ? 'pointer' : 'default', fontSize:10, color:'#ffe040', fontFamily:"'DM Sans',sans-serif", fontWeight:600, whiteSpace:'nowrap' }}>
            <div style={{ width:6, height:6, borderRadius:'50%', background:'#ffe040', boxShadow:'0 0 6px #ffe040', animation:'pulse-dot 1.5s ease-in-out infinite' }}/>
            {studyTimerSubject ? `${studyTimerSubject} · ` : '📚 '}{fmtSecs(studySecs)}
          </button>
        )}
        {workTimerStart && (
          <button onClick={onGoToProductividad} style={{ display:'flex', alignItems:'center', gap:6, padding:'4px 10px', borderRadius:20, border:'1px solid #00aaff50', background:'#00aaff12', cursor: onGoToProductividad ? 'pointer' : 'default', fontSize:10, color:'#00aaff', fontFamily:"'DM Sans',sans-serif", fontWeight:600, whiteSpace:'nowrap' }}>
            <div style={{ width:6, height:6, borderRadius:'50%', background:'#00aaff', boxShadow:'0 0 6px #00aaff', animation:'pulse-dot 1.5s ease-in-out infinite' }}/>
            {workTimerSubject ? `${workTimerSubject} · ` : '💼 '}{fmtSecs(workSecs)}
          </button>
        )}

        {!mobile && (
          <div style={{ fontSize:11, color:'rgba(255,255,255,0.3)', letterSpacing:.3 }}>
            {new Date().toLocaleDateString('es-MX', { weekday:'short', day:'numeric', month:'long', year:'numeric' }).replace(/^\w/, c => c.toUpperCase())}
          </div>
        )}
        <div style={{ width:8, height:8, borderRadius:4, background:'#00e896', boxShadow:'0 0 8px #00e89699', animation:'pulse-dot 2s ease-in-out infinite' }}/>
        <div style={{ width:30, height:30, borderRadius:15, background:'linear-gradient(135deg,#00aaff,#0040a0)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:900, color:'white', border:'1.5px solid rgba(0,170,255,0.3)', boxShadow:'0 0 10px rgba(0,170,255,0.2)', cursor:'pointer' }}>SS</div>
      </div>
    </div>
  );
}
